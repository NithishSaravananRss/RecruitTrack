package io.recruittrack.backend.interviews;

import io.recruittrack.backend.applications.Application;
import io.recruittrack.backend.applications.ApplicationRepository;
import io.recruittrack.backend.applications.dto.ApplicationSummaryResponse;
import io.recruittrack.backend.common.dto.PageResponse;
import io.recruittrack.backend.common.dto.UserSummaryDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import io.recruittrack.backend.common.enums.InterviewStatus;
import io.recruittrack.backend.common.exception.BusinessRuleException;
import io.recruittrack.backend.common.exception.ErrorCode;
import io.recruittrack.backend.common.exception.ResourceNotFoundException;
import io.recruittrack.backend.interviews.dto.*;
import io.recruittrack.backend.jobs.Job;
import io.recruittrack.backend.pipeline.PipelineStage;
import io.recruittrack.backend.pipeline.PipelineStageRepository;
import io.recruittrack.backend.pipeline.dto.PipelineStageResponse;
import io.recruittrack.backend.security.UserPrincipal;
import io.recruittrack.backend.users.User;
import io.recruittrack.backend.users.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class InterviewServiceImpl implements InterviewService {

    private final InterviewRepository interviewRepository;
    private final ApplicationRepository applicationRepository;
    private final PipelineStageRepository pipelineStageRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public InterviewResponse scheduleInterview(ScheduleInterviewRequest request, UserPrincipal principal) {
        Application application = applicationRepository.findById(request.getApplicationId())
                .orElseThrow(() -> new ResourceNotFoundException("Application", request.getApplicationId()));

        checkAccess(application.getJob(), principal);

        PipelineStage stage = pipelineStageRepository.findById(request.getStageId())
                .orElseThrow(() -> new ResourceNotFoundException("PipelineStage", request.getStageId()));

        User creator = userRepository.getReferenceById(principal.getId());

        Interview interview = Interview.builder()
                .application(application)
                .stage(stage)
                .scheduledAt(request.getScheduledAt())
                .durationMinutes(request.getDurationMinutes())
                .location(request.getLocation())
                .meetingLink(request.getMeetingLink())
                .instructions(request.getInstructions())
                .interviewerIds(request.getInterviewerIds().toArray(new UUID[0]))
                .createdBy(creator)
                .build();

        interview = interviewRepository.save(interview);
        log.info("Interview scheduled: id={}, applicationId={}", interview.getId(), application.getId());
        
        return toResponse(interview);
    }

    @Override
    public InterviewResponse getInterview(UUID interviewId, UserPrincipal principal) {
        Interview interview = loadInterview(interviewId);
        checkAccess(interview.getApplication().getJob(), principal);
        return toResponse(interview);
    }

    @Override
    @Transactional
    public InterviewResponse updateInterview(UUID interviewId, UpdateInterviewRequest request, UserPrincipal principal) {
        Interview interview = loadInterview(interviewId);
        checkAccess(interview.getApplication().getJob(), principal);

        if (interview.getStatus() != InterviewStatus.SCHEDULED) {
            throw new BusinessRuleException(ErrorCode.VALIDATION_FAILED, "Cannot update a non-SCHEDULED interview");
        }

        PipelineStage stage = pipelineStageRepository.findById(request.getStageId())
                .orElseThrow(() -> new ResourceNotFoundException("PipelineStage", request.getStageId()));

        interview.setStage(stage);
        interview.setScheduledAt(request.getScheduledAt());
        interview.setDurationMinutes(request.getDurationMinutes());
        interview.setLocation(request.getLocation());
        interview.setMeetingLink(request.getMeetingLink());
        interview.setInstructions(request.getInstructions());
        interview.setInterviewerIds(request.getInterviewerIds().toArray(new UUID[0]));

        interview = interviewRepository.save(interview);
        log.info("Interview updated: id={}", interview.getId());
        return toResponse(interview);
    }

    @Override
    @Transactional
    public InterviewResponse cancelInterview(UUID interviewId, CancelInterviewRequest request, UserPrincipal principal) {
        Interview interview = loadInterview(interviewId);
        checkAccess(interview.getApplication().getJob(), principal);

        if (interview.getStatus() == InterviewStatus.COMPLETED) {
            throw new BusinessRuleException(ErrorCode.VALIDATION_FAILED, "Cannot cancel a COMPLETED interview");
        }

        interview.setStatus(InterviewStatus.CANCELLED);
        interview = interviewRepository.save(interview);
        log.info("Interview cancelled: id={}", interview.getId());
        return toResponse(interview);
    }

    @Override
    @Transactional
    public InterviewResponse completeInterview(UUID interviewId, CompleteInterviewRequest request, UserPrincipal principal) {
        Interview interview = loadInterview(interviewId);
        checkAccess(interview.getApplication().getJob(), principal);

        if (interview.getStatus() == InterviewStatus.CANCELLED) {
            throw new BusinessRuleException(ErrorCode.VALIDATION_FAILED, "Cannot complete a CANCELLED interview");
        }

        interview.setStatus(InterviewStatus.COMPLETED);
        interview = interviewRepository.save(interview);
        log.info("Interview completed: id={}", interview.getId());
        return toResponse(interview);
    }

    @Override
    public PageResponse<InterviewResponse> getAllInterviews(Pageable pageable, UserPrincipal principal) {
        Page<Interview> page;
        if ("HIRING_MANAGER".equals(principal.getRole())) {
            // Need to join via application -> job -> hiringManager to filter
            // For MVP simplicity and keeping repository minimal without custom query,
            // we will fetch all and filter in memory, though inefficient.
            // Wait, since we can't change repo without complex JPQL, let's just 
            // allow ADMIN/RECRUITER to fetch all. For HM, we return only theirs.
            // Actually, we can just fetch all and filter.
            List<Interview> all = interviewRepository.findAll();
            List<InterviewResponse> filtered = all.stream()
                .filter(i -> i.getApplication().getJob().getHiringManager() != null &&
                             i.getApplication().getJob().getHiringManager().getId().equals(principal.getId()))
                .map(this::toResponse)
                .toList();
            // Basic memory pagination
            int start = (int) pageable.getOffset();
            int end = Math.min((start + pageable.getPageSize()), filtered.size());
            List<InterviewResponse> content = start > filtered.size() ? List.of() : filtered.subList(start, end);
            return PageResponse.<InterviewResponse>builder()
                    .content(content)
                    .page(pageable.getPageNumber())
                    .size(pageable.getPageSize())
                    .totalElements((long) filtered.size())
                    .totalPages((filtered.size() + pageable.getPageSize() - 1) / pageable.getPageSize())
                    .last(end >= filtered.size())
                    .build();
        } else {
            page = interviewRepository.findAll(pageable);
            return PageResponse.<InterviewResponse>builder()
                    .content(page.getContent().stream().map(this::toResponse).toList())
                    .page(page.getNumber())
                    .size(page.getSize())
                    .totalElements(page.getTotalElements())
                    .totalPages(page.getTotalPages())
                    .last(page.isLast())
                    .build();
        }
    }

    @Override
    public PageResponse<InterviewResponse> getInterviewsByApplication(UUID applicationId, Pageable pageable, UserPrincipal principal) {
        Application application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new ResourceNotFoundException("Application", applicationId));
        
        checkAccess(application.getJob(), principal);
        
        Page<Interview> page = interviewRepository.findAllByApplicationId(applicationId, pageable);
        return PageResponse.<InterviewResponse>builder()
                .content(page.getContent().stream().map(this::toResponse).toList())
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .build();
    }

    // ─── Helpers ──────────────────────────────────────────────

    private Interview loadInterview(UUID id) {
        return interviewRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Interview", id));
    }

    private void checkAccess(Job job, UserPrincipal principal) {
        if ("HIRING_MANAGER".equals(principal.getRole())) {
            if (job.getHiringManager() == null || !job.getHiringManager().getId().equals(principal.getId())) {
                throw new BusinessRuleException(ErrorCode.UNAUTHORIZED, "Access denied to interview for this job");
            }
        }
    }

    private InterviewResponse toResponse(Interview interview) {
        List<UserSummaryDto> interviewers = new ArrayList<>();
        if (interview.getInterviewerIds() != null) {
            for (UUID uId : interview.getInterviewerIds()) {
                // In a highly optimized system, we would batch fetch this.
                // For this MVP, we perform safe lookups.
                userRepository.findById(uId).ifPresent(u -> interviewers.add(UserSummaryDto.builder()
                        .id(u.getId())
                        .firstName(u.getFirstName())
                        .lastName(u.getLastName())
                        .email(u.getEmail())
                        .avatarUrl(u.getAvatarUrl())
                        .build()));
            }
        }

        return InterviewResponse.builder()
                .id(interview.getId())
                .application(ApplicationSummaryResponse.builder()
                        .id(interview.getApplication().getId())
                        .candidate(io.recruittrack.backend.candidates.dto.CandidateSummaryResponse.builder()
                                .id(interview.getApplication().getCandidate().getId())
                                .firstName(interview.getApplication().getCandidate().getFirstName())
                                .lastName(interview.getApplication().getCandidate().getLastName())
                                .build())
                        .job(io.recruittrack.backend.jobs.dto.JobSummaryResponse.builder()
                                .id(interview.getApplication().getJob().getId())
                                .title(interview.getApplication().getJob().getTitle())
                                .build())
                        .appliedAt(interview.getApplication().getAppliedAt())
                        .build())
                .stage(PipelineStageResponse.builder()
                        .id(interview.getStage().getId())
                        .name(interview.getStage().getName())
                        .stageType(interview.getStage().getStageType())
                        .position(interview.getStage().getPosition())
                        .build())
                .status(interview.getStatus())
                .scheduledAt(interview.getScheduledAt())
                .durationMinutes(interview.getDurationMinutes())
                .location(interview.getLocation())
                .meetingLink(interview.getMeetingLink())
                .instructions(interview.getInstructions())
                .interviewers(interviewers)
                .createdAt(interview.getCreatedAt())
                .updatedAt(interview.getUpdatedAt())
                .build();
    }
}
