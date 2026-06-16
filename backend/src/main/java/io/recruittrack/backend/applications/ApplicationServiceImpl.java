package io.recruittrack.backend.applications;

import io.recruittrack.backend.applications.dto.*;
import io.recruittrack.backend.candidates.Candidate;
import io.recruittrack.backend.candidates.CandidateRepository;
import io.recruittrack.backend.candidates.dto.CandidateSummaryResponse;
import io.recruittrack.backend.common.dto.PageResponse;
import io.recruittrack.backend.common.exception.BusinessRuleException;
import io.recruittrack.backend.common.exception.ErrorCode;
import io.recruittrack.backend.common.exception.ResourceNotFoundException;
import io.recruittrack.backend.jobs.Job;
import io.recruittrack.backend.jobs.JobRepository;
import io.recruittrack.backend.jobs.dto.JobSummaryResponse;
import io.recruittrack.backend.pipeline.ApplicationStageHistory;
import io.recruittrack.backend.pipeline.ApplicationStageHistoryRepository;
import io.recruittrack.backend.pipeline.PipelineStage;
import io.recruittrack.backend.pipeline.PipelineStageRepository;
import io.recruittrack.backend.pipeline.dto.PipelineStageResponse;
import io.recruittrack.backend.security.UserPrincipal;
import io.recruittrack.backend.users.User;
import io.recruittrack.backend.users.UserRepository;
import io.recruittrack.backend.audit.SystemAuditLogService;
import io.recruittrack.backend.candidates.CandidateTimelineEventService;
import io.recruittrack.backend.notifications.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ApplicationServiceImpl implements ApplicationService {

    private final ApplicationRepository applicationRepository;
    private final JobRepository jobRepository;
    private final CandidateRepository candidateRepository;
    private final PipelineStageRepository pipelineStageRepository;
    private final ApplicationStageHistoryRepository historyRepository;
    private final UserRepository userRepository;
    private final SystemAuditLogService auditLogService;
    private final CandidateTimelineEventService timelineEventService;
    private final NotificationService notificationService;

    @Override
    @Transactional
    public ApplicationResponse createApplication(CreateApplicationRequest request, UserPrincipal principal) {
        Candidate candidate = candidateRepository.findById(request.getCandidateId())
                .orElseThrow(() -> new ResourceNotFoundException("Candidate", request.getCandidateId()));

        Job job = jobRepository.findById(request.getJobId())
                .orElseThrow(() -> new ResourceNotFoundException("Job", request.getJobId()));

        if (applicationRepository.existsActiveApplicationForCandidateAndJob(candidate.getId(), job.getId())) {
            throw new BusinessRuleException(ErrorCode.VALIDATION_FAILED, "Candidate already has an active application for this job.");
        }

        PipelineStage firstStage = pipelineStageRepository.findByNameIgnoreCase("Applied")
                .orElseGet(() -> pipelineStageRepository.findAllByOrderByPositionAsc().stream()
                        .findFirst()
                        .orElseThrow(() -> new IllegalStateException("No pipeline stages configured")));

        Application application = Application.builder()
                .candidate(candidate)
                .job(job)
                .currentStage(firstStage)
                .build();

        application = applicationRepository.save(application);

        User creator = userRepository.getReferenceById(principal.getId());

        ApplicationStageHistory history = ApplicationStageHistory.builder()
                .application(application)
                .fromStage(null)
                .toStage(firstStage)
                .movedBy(creator)
                .notes("Application Created")
                .movedAt(Instant.now())
                .build();

        historyRepository.save(history);

        log.info("Application created: id={} for candidate={} job={}", application.getId(), candidate.getId(), job.getId());
        return toResponse(application);
    }

    @Override
    public ApplicationResponse getApplication(UUID applicationId, UserPrincipal principal) {
        Application application = loadApplication(applicationId);
        checkAccess(application.getJob(), principal);
        return toResponse(application);
    }

    @Override
    public PageResponse<ApplicationSummaryResponse> getApplicationsByJob(UUID jobId, Pageable pageable, UserPrincipal principal) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new ResourceNotFoundException("Job", jobId));
        checkAccess(job, principal);

        Page<Application> page = applicationRepository.findAllByJobId(jobId, pageable);
        return PageResponse.from(page.map(this::toSummaryResponse));
    }

    @Override
    public PageResponse<ApplicationSummaryResponse> getApplicationsByCandidate(UUID candidateId, Pageable pageable, UserPrincipal principal) {
        // Technically candidates are global, but we should probably filter out jobs the HM can't see.
        // For MVP, we'll just return them all.
        if (!candidateRepository.existsById(candidateId)) {
            throw new ResourceNotFoundException("Candidate", candidateId);
        }

        Page<Application> page = applicationRepository.findAllByCandidateId(candidateId, pageable);
        return PageResponse.from(page.map(this::toSummaryResponse));
    }

    @Override
    @Transactional
    public ApplicationResponse moveApplicationStage(UUID applicationId, MoveApplicationStageRequest request, UserPrincipal principal) {
        Application application = loadApplication(applicationId);
        checkAccess(application.getJob(), principal);

        if (application.getIsRejected()) {
            throw new BusinessRuleException(ErrorCode.VALIDATION_FAILED, "Cannot move a rejected application");
        }

        PipelineStage toStage = pipelineStageRepository.findById(request.getStageId())
                .orElseThrow(() -> new ResourceNotFoundException("PipelineStage", request.getStageId()));

        PipelineStage fromStage = application.getCurrentStage();

        if (fromStage.getId().equals(toStage.getId())) {
            throw new BusinessRuleException(ErrorCode.VALIDATION_FAILED, "Application is already in the target stage");
        }

        application.setCurrentStage(toStage);
        application = applicationRepository.save(application);

        User mover = userRepository.getReferenceById(principal.getId());

        ApplicationStageHistory history = ApplicationStageHistory.builder()
                .application(application)
                .fromStage(fromStage)
                .toStage(toStage)
                .movedBy(mover)
                .notes(request.getNotes())
                .movedAt(Instant.now())
                .build();

        historyRepository.save(history);

        // Timeline Event
        timelineEventService.logEvent(
                application.getCandidate().getId(),
                "STAGE_CHANGED",
                "Moved to " + toStage.getName(),
                "Candidate moved from " + fromStage.getName() + " to " + toStage.getName() + (request.getNotes() != null ? " with notes: " + request.getNotes() : ""),
                principal
        );

        // Audit Log
        java.util.Map<String, Object> metadata = new java.util.HashMap<>();
        metadata.put("candidateId", application.getCandidate().getId().toString());
        metadata.put("candidateName", application.getCandidate().getFirstName() + " " + application.getCandidate().getLastName());
        metadata.put("jobId", application.getJob().getId().toString());
        metadata.put("jobTitle", application.getJob().getTitle());
        metadata.put("fromStage", fromStage.getName());
        metadata.put("toStage", toStage.getName());
        if (request.getNotes() != null) {
            metadata.put("notes", request.getNotes());
        }

        auditLogService.logAction(
                "STAGE_CHANGED",
                "APPLICATION",
                application.getId(),
                principal.getId(),
                principal.getUsername(),
                "Moved candidate " + application.getCandidate().getFirstName() + " to " + toStage.getName() + " for job " + application.getJob().getTitle(),
                metadata
        );

        // Notifications
        String notifMsg = "Candidate " + application.getCandidate().getFirstName() + " " + application.getCandidate().getLastName() + " moved to " + toStage.getName() + " for job " + application.getJob().getTitle();
        if (application.getJob().getHiringManager() != null) {
            notificationService.createNotification(application.getJob().getHiringManager(), notifMsg, application.getId(), "APPLICATION");
        }
        
        log.info("Application {} stage changed from {} to {}", application.getId(), fromStage.getName(), toStage.getName());
        return toResponse(application);
    }

    @Override
    @Transactional
    public ApplicationResponse rejectApplication(UUID applicationId, RejectApplicationRequest request, UserPrincipal principal) {
        Application application = loadApplication(applicationId);
        checkAccess(application.getJob(), principal);

        if (application.getIsRejected()) {
            throw new BusinessRuleException(ErrorCode.VALIDATION_FAILED, "Application is already rejected");
        }

        application.setIsRejected(true);
        application.setRejectionReason(request.getRejectionReason());
        
        PipelineStage rejectedStage = pipelineStageRepository.findByNameIgnoreCase("Rejected")
                .orElse(null);
                
        PipelineStage fromStage = application.getCurrentStage();
        
        if (rejectedStage != null) {
            application.setCurrentStage(rejectedStage);
        }

        application = applicationRepository.save(application);

        User rejecter = userRepository.getReferenceById(principal.getId());

        ApplicationStageHistory history = ApplicationStageHistory.builder()
                .application(application)
                .fromStage(fromStage)
                .toStage(rejectedStage != null ? rejectedStage : fromStage)
                .movedBy(rejecter)
                .notes("Rejected: " + request.getRejectionReason())
                .movedAt(Instant.now())
                .build();

        historyRepository.save(history);

        log.info("Application {} rejected. Reason: {}", application.getId(), request.getRejectionReason());
        return toResponse(application);
    }

    // ─── Helpers ──────────────────────────────────────────────

    private Application loadApplication(UUID id) {
        return applicationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Application", id));
    }

    private void checkAccess(Job job, UserPrincipal principal) {
        if ("HIRING_MANAGER".equals(principal.getRole())) {
            if (job.getHiringManager() == null || !job.getHiringManager().getId().equals(principal.getId())) {
                throw new BusinessRuleException(ErrorCode.UNAUTHORIZED, "Access denied to applications for this job");
            }
        }
    }

    private ApplicationResponse toResponse(Application application) {
        return ApplicationResponse.builder()
                .id(application.getId())
                .candidate(CandidateSummaryResponse.builder()
                        .id(application.getCandidate().getId())
                        .firstName(application.getCandidate().getFirstName())
                        .lastName(application.getCandidate().getLastName())
                        .email(application.getCandidate().getEmail())
                        .avatarUrl(application.getCandidate().getAvatarUrl())
                        .build())
                .job(JobSummaryResponse.builder()
                        .id(application.getJob().getId())
                        .title(application.getJob().getTitle())
                        .department(application.getJob().getDepartment())
                        .reqId(application.getJob().getReqId())
                        .build())
                .currentStage(toStageResponse(application.getCurrentStage()))
                .isRejected(application.getIsRejected())
                .rejectionReason(application.getRejectionReason())
                .appliedAt(application.getAppliedAt())
                .updatedAt(application.getUpdatedAt())
                .build();
    }

    private ApplicationSummaryResponse toSummaryResponse(Application application) {
        return ApplicationSummaryResponse.builder()
                .id(application.getId())
                .candidate(CandidateSummaryResponse.builder()
                        .id(application.getCandidate().getId())
                        .firstName(application.getCandidate().getFirstName())
                        .lastName(application.getCandidate().getLastName())
                        .email(application.getCandidate().getEmail())
                        .currentTitle(application.getCandidate().getCurrentTitle())
                        .currentCompany(application.getCandidate().getCurrentCompany())
                        .avatarUrl(application.getCandidate().getAvatarUrl())
                        .build())
                .job(JobSummaryResponse.builder()
                        .id(application.getJob().getId())
                        .title(application.getJob().getTitle())
                        .department(application.getJob().getDepartment())
                        .reqId(application.getJob().getReqId())
                        .build())
                .currentStage(toStageResponse(application.getCurrentStage()))
                .isRejected(application.getIsRejected())
                .appliedAt(application.getAppliedAt())
                .build();
    }

    private PipelineStageResponse toStageResponse(PipelineStage stage) {
        if (stage == null) return null;
        return PipelineStageResponse.builder()
                .id(stage.getId())
                .name(stage.getName())
                .position(stage.getPosition())
                .stageType(stage.getStageType())
                .build();
    }
}
