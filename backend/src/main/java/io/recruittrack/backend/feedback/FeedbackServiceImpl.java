package io.recruittrack.backend.feedback;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.recruittrack.backend.applications.Application;
import io.recruittrack.backend.applications.ApplicationRepository;
import io.recruittrack.backend.applications.dto.ApplicationSummaryResponse;
import io.recruittrack.backend.common.dto.PageResponse;
import io.recruittrack.backend.common.dto.UserSummaryDto;
import io.recruittrack.backend.common.enums.InterviewStatus;
import io.recruittrack.backend.common.exception.BusinessRuleException;
import io.recruittrack.backend.common.exception.ErrorCode;
import io.recruittrack.backend.common.exception.ResourceNotFoundException;
import io.recruittrack.backend.feedback.dto.*;
import io.recruittrack.backend.interviews.Interview;
import io.recruittrack.backend.interviews.InterviewRepository;
import io.recruittrack.backend.interviews.dto.InterviewSummaryResponse;
import io.recruittrack.backend.jobs.Job;
import io.recruittrack.backend.security.UserPrincipal;
import io.recruittrack.backend.users.User;
import io.recruittrack.backend.users.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FeedbackServiceImpl implements FeedbackService {

    private final FeedbackRepository feedbackRepository;
    private final InterviewRepository interviewRepository;
    private final ApplicationRepository applicationRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional
    public FeedbackResponse submitFeedback(SubmitFeedbackRequest request, UserPrincipal principal) {
        Interview interview = interviewRepository.findById(request.getInterviewId())
                .orElseThrow(() -> new ResourceNotFoundException("Interview", request.getInterviewId()));

        Application application = interview.getApplication();
        checkAccess(application.getJob(), principal);

        if (interview.getStatus() != InterviewStatus.COMPLETED) {
            throw new BusinessRuleException(ErrorCode.VALIDATION_FAILED, "Feedback can only be submitted for COMPLETED interviews");
        }

        if (feedbackRepository.existsByInterviewIdAndInterviewerId(interview.getId(), principal.getId())) {
            throw new BusinessRuleException(ErrorCode.VALIDATION_FAILED, "Feedback has already been submitted by this interviewer for this interview");
        }

        User interviewer = userRepository.getReferenceById(principal.getId());

        String ratingsJson = serializeRatings(request.getRatings());

        Feedback feedback = Feedback.builder()
                .interview(interview)
                .application(application)
                .interviewer(interviewer)
                .recommendation(request.getRecommendation())
                .overallComments(request.getOverallComments())
                .ratingsJson(ratingsJson)
                .build();

        feedback = feedbackRepository.save(feedback);
        log.info("Feedback submitted: id={}, interviewId={}, interviewerId={}", feedback.getId(), interview.getId(), interviewer.getId());
        return toResponse(feedback);
    }

    @Override
    public FeedbackResponse getFeedback(UUID feedbackId, UserPrincipal principal) {
        Feedback feedback = loadFeedback(feedbackId);
        checkAccess(feedback.getApplication().getJob(), principal);
        return toResponse(feedback);
    }

    @Override
    @Transactional
    public FeedbackResponse updateFeedback(UUID feedbackId, UpdateFeedbackRequest request, UserPrincipal principal) {
        Feedback feedback = loadFeedback(feedbackId);
        checkAccess(feedback.getApplication().getJob(), principal);

        // Optional: Ensure only the creator can update their own feedback, 
        // or Admin can update.
        if (!feedback.getInterviewer().getId().equals(principal.getId()) && !"ADMIN".equals(principal.getRole())) {
            throw new BusinessRuleException(ErrorCode.UNAUTHORIZED, "You can only update your own feedback");
        }

        feedback.setRecommendation(request.getRecommendation());
        feedback.setOverallComments(request.getOverallComments());
        feedback.setRatingsJson(serializeRatings(request.getRatings()));

        feedback = feedbackRepository.save(feedback);
        log.info("Feedback updated: id={}", feedback.getId());
        return toResponse(feedback);
    }

    @Override
    public PageResponse<FeedbackResponse> getFeedbackByApplication(UUID applicationId, Pageable pageable, UserPrincipal principal) {
        Application application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new ResourceNotFoundException("Application", applicationId));
        checkAccess(application.getJob(), principal);

        Page<Feedback> feedbackPage = feedbackRepository.findAllByApplicationId(applicationId, pageable);
        List<FeedbackResponse> content = feedbackPage.getContent().stream()
                .map(this::toResponse)
                .toList();
        
        return PageResponse.<FeedbackResponse>builder()
                .content(content)
                .page(feedbackPage.getNumber())
                .size(feedbackPage.getSize())
                .totalElements(feedbackPage.getTotalElements())
                .totalPages(feedbackPage.getTotalPages())
                .build();
    }

    @Override
    public PageResponse<FeedbackResponse> getFeedbackByInterview(UUID interviewId, Pageable pageable, UserPrincipal principal) {
        Interview interview = interviewRepository.findById(interviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Interview", interviewId));
        checkAccess(interview.getApplication().getJob(), principal);

        Page<Feedback> feedbackPage = feedbackRepository.findAllByInterviewId(interviewId, pageable);
        List<FeedbackResponse> content = feedbackPage.getContent().stream()
                .map(this::toResponse)
                .toList();
        
        return PageResponse.<FeedbackResponse>builder()
                .content(content)
                .page(feedbackPage.getNumber())
                .size(feedbackPage.getSize())
                .totalElements(feedbackPage.getTotalElements())
                .totalPages(feedbackPage.getTotalPages())
                .build();
    }

    // ─── Helpers ──────────────────────────────────────────────

    private Feedback loadFeedback(UUID id) {
        return feedbackRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Feedback", id));
    }

    private void checkAccess(Job job, UserPrincipal principal) {
        if ("HIRING_MANAGER".equals(principal.getRole())) {
            if (job.getHiringManager() == null || !job.getHiringManager().getId().equals(principal.getId())) {
                throw new BusinessRuleException(ErrorCode.UNAUTHORIZED, "Access denied to feedback for this job");
            }
        }
    }

    private String serializeRatings(List<RatingDto> ratings) {
        if (ratings == null || ratings.isEmpty()) return null;
        try {
            return objectMapper.writeValueAsString(ratings);
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize ratings", e);
            throw new BusinessRuleException(ErrorCode.VALIDATION_FAILED, "Invalid ratings format");
        }
    }

    private List<RatingDto> deserializeRatings(String ratingsJson) {
        if (ratingsJson == null || ratingsJson.isEmpty()) return new ArrayList<>();
        try {
            return objectMapper.readValue(ratingsJson, new TypeReference<List<RatingDto>>() {});
        } catch (JsonProcessingException e) {
            log.error("Failed to deserialize ratings", e);
            return new ArrayList<>();
        }
    }

    private FeedbackResponse toResponse(Feedback feedback) {
        return FeedbackResponse.builder()
                .id(feedback.getId())
                .interview(InterviewSummaryResponse.builder()
                        .id(feedback.getInterview().getId())
                        .applicationId(feedback.getApplication().getId())
                        .candidateName(feedback.getApplication().getCandidate().getFullName())
                        .jobTitle(feedback.getApplication().getJob().getTitle())
                        .stageName(feedback.getInterview().getStage().getName())
                        .status(feedback.getInterview().getStatus())
                        .scheduledAt(feedback.getInterview().getScheduledAt())
                        .durationMinutes(feedback.getInterview().getDurationMinutes())
                        .build())
                .application(ApplicationSummaryResponse.builder()
                        .id(feedback.getApplication().getId())
                        .candidate(io.recruittrack.backend.candidates.dto.CandidateSummaryResponse.builder()
                                .id(feedback.getApplication().getCandidate().getId())
                                .firstName(feedback.getApplication().getCandidate().getFirstName())
                                .lastName(feedback.getApplication().getCandidate().getLastName())
                                .build())
                        .job(io.recruittrack.backend.jobs.dto.JobSummaryResponse.builder()
                                .id(feedback.getApplication().getJob().getId())
                                .title(feedback.getApplication().getJob().getTitle())
                                .build())
                        .appliedAt(feedback.getApplication().getAppliedAt())
                        .build())
                .interviewer(UserSummaryDto.builder()
                        .id(feedback.getInterviewer().getId())
                        .firstName(feedback.getInterviewer().getFirstName())
                        .lastName(feedback.getInterviewer().getLastName())
                        .email(feedback.getInterviewer().getEmail())
                        .avatarUrl(feedback.getInterviewer().getAvatarUrl())
                        .build())
                .recommendation(feedback.getRecommendation())
                .overallComments(feedback.getOverallComments())
                .ratings(deserializeRatings(feedback.getRatingsJson()))
                .createdAt(feedback.getCreatedAt())
                .updatedAt(feedback.getUpdatedAt())
                .build();
    }
}
