package io.recruittrack.backend.jobs;

import io.recruittrack.backend.common.dto.PageResponse;
import io.recruittrack.backend.common.dto.UserSummaryDto;
import io.recruittrack.backend.common.enums.*;
import io.recruittrack.backend.common.exception.BusinessRuleException;
import io.recruittrack.backend.common.exception.ErrorCode;
import io.recruittrack.backend.common.exception.ForbiddenException;
import io.recruittrack.backend.common.exception.ResourceNotFoundException;
import io.recruittrack.backend.jobs.dto.*;
import io.recruittrack.backend.security.UserPrincipal;
import io.recruittrack.backend.users.User;
import io.recruittrack.backend.users.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.Year;
import java.util.UUID;

/**
 * Jobs business logic implementation.
 *
 * Key responsibilities:
 * - req_id generation (RT-{YEAR}-{NNN})
 * - Status transition enforcement via JobStatus.canTransitionTo()
 * - HIRING_MANAGER data scoping (they see only their assigned jobs)
 * - published_at set on DRAFT → ACTIVE transition
 * - Soft delete (deleted_at) instead of hard DELETE
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class JobServiceImpl implements JobService {

    private final JobRepository  jobRepository;
    private final UserRepository userRepository;

    // ─── Create ───────────────────────────────────────────────

    @Override
    @Transactional
    public JobResponse createJob(CreateJobRequest request, UserPrincipal principal) {
        User creator = loadUser(principal.getId());

        // Resolve optional hiring manager
        User hiringManager = null;
        if (request.getHiringManagerId() != null) {
            hiringManager = loadUser(request.getHiringManagerId());
        }

        // Determine initial status (default: DRAFT)
        JobStatus initialStatus = request.getStatus() != null ? request.getStatus() : JobStatus.DRAFT;

        Job job = Job.builder()
                .title(request.getTitle().trim())
                .department(request.getDepartment())
                .location(request.getLocation())
                .workMode(request.getWorkMode())
                .jobType(request.getJobType())
                .seniorityLevel(request.getSeniorityLevel())
                .status(initialStatus)
                .description(request.getDescription())
                .requirements(request.getRequirements())
                .responsibilities(request.getResponsibilities())
                .salaryMin(request.getSalaryMin())
                .salaryMax(request.getSalaryMax())
                .salaryCurrency(request.getSalaryCurrency() != null ? request.getSalaryCurrency() : "USD")
                .headcount(request.getHeadcount() != null ? request.getHeadcount() : 1)
                .reqId(generateReqId())
                .hiringManager(hiringManager)
                .createdBy(creator)
                .closingDate(request.getClosingDate())
                .build();

        // Set published_at if starting as ACTIVE
        if (initialStatus == JobStatus.ACTIVE) {
            job.setPublishedAt(Instant.now());
        }

        job = jobRepository.save(job);
        log.info("Job created: reqId={}, title='{}', by userId={}",
                job.getReqId(), job.getTitle(), principal.getId());

        return toJobResponse(job);
    }

    // ─── List ─────────────────────────────────────────────────

    @Override
    public PageResponse<JobSummaryResponse> getJobs(
            String search, JobStatus status, String department,
            WorkMode workMode, JobType jobType, SeniorityLevel seniorityLevel,
            String location, UUID hiringManagerId, Pageable pageable, UserPrincipal principal) {

        Specification<Job> spec = buildSpec(
                search, status, department, workMode, jobType, seniorityLevel, location, hiringManagerId, principal);

        Page<JobSummaryResponse> page = jobRepository.findAll(spec, pageable)
                .map(this::toJobSummaryResponse);

        return PageResponse.from(page);
    }

    // ─── Get by ID ────────────────────────────────────────────

    @Override
    public JobResponse getJob(UUID jobId, UserPrincipal principal) {
        Job job = loadJob(jobId);
        assertHiringManagerCanAccess(job, principal);
        return toJobResponse(job);
    }

    // ─── Update ───────────────────────────────────────────────

    @Override
    @Transactional
    public JobResponse updateJob(UUID jobId, UpdateJobRequest request, UserPrincipal principal) {
        Job job = loadJob(jobId);

        // Resolve hiring manager (null clears the assignment)
        User hiringManager = null;
        if (request.getHiringManagerId() != null) {
            hiringManager = loadUser(request.getHiringManagerId());
        }

        job.setTitle(request.getTitle().trim());
        job.setDepartment(request.getDepartment());
        job.setLocation(request.getLocation());
        job.setWorkMode(request.getWorkMode());
        job.setJobType(request.getJobType());
        job.setSeniorityLevel(request.getSeniorityLevel());
        job.setDescription(request.getDescription());
        job.setRequirements(request.getRequirements());
        job.setResponsibilities(request.getResponsibilities());
        job.setSalaryMin(request.getSalaryMin());
        job.setSalaryMax(request.getSalaryMax());
        if (request.getSalaryCurrency() != null) {
            job.setSalaryCurrency(request.getSalaryCurrency());
        }
        if (request.getHeadcount() != null) {
            job.setHeadcount(request.getHeadcount());
        }
        job.setHiringManager(hiringManager);
        job.setClosingDate(request.getClosingDate());

        job = jobRepository.save(job);
        log.info("Job updated: reqId={}, by userId={}", job.getReqId(), principal.getId());

        return toJobResponse(job);
    }

    // ─── Update Status ────────────────────────────────────────

    @Override
    @Transactional
    public JobResponse updateJobStatus(UUID jobId, UpdateJobStatusRequest request, UserPrincipal principal) {
        Job job = loadJob(jobId);

        JobStatus current = job.getStatus();
        JobStatus target  = request.getStatus();

        if (!current.canTransitionTo(target)) {
            throw new BusinessRuleException(ErrorCode.INVALID_STATUS_TRANSITION,
                    String.format("Cannot transition job from '%s' to '%s'", current, target));
        }

        job.setStatus(target);

        // Set published_at when job goes live for the first time
        if (target == JobStatus.ACTIVE && job.getPublishedAt() == null) {
            job.setPublishedAt(Instant.now());
        }

        job = jobRepository.save(job);
        log.info("Job status changed: reqId={}, {} → {}, by userId={}",
                job.getReqId(), current, target, principal.getId());

        return toJobResponse(job);
    }

    // ─── Delete ───────────────────────────────────────────────

    @Override
    @Transactional
    public void deleteJob(UUID jobId, UserPrincipal principal) {
        Job job = loadJob(jobId);

        // Guard: cannot delete a job with active applications (enforced fully in Phase 7)
        // Placeholder check — hasActiveApplications() returns false until applications table exists
        if (jobRepository.hasActiveApplications(jobId)) {
            throw new BusinessRuleException(ErrorCode.JOB_HAS_ACTIVE_APPLICATIONS,
                    "Cannot delete a job that has active applications. Close the job first.");
        }

        User deleter = loadUser(principal.getId());
        jobRepository.softDeleteById(jobId, deleter, Instant.now());

        log.info("Job soft-deleted: reqId={}, by userId={}", job.getReqId(), principal.getId());
    }

    // ─── Mapping ──────────────────────────────────────────────

    private JobResponse toJobResponse(Job job) {
        return JobResponse.builder()
                .id(job.getId())
                .reqId(job.getReqId())
                .title(job.getTitle())
                .department(job.getDepartment())
                .location(job.getLocation())
                .workMode(job.getWorkMode())
                .jobType(job.getJobType())
                .seniorityLevel(job.getSeniorityLevel())
                .status(job.getStatus())
                .description(job.getDescription())
                .requirements(job.getRequirements())
                .responsibilities(job.getResponsibilities())
                .salaryMin(job.getSalaryMin())
                .salaryMax(job.getSalaryMax())
                .salaryCurrency(job.getSalaryCurrency())
                .headcount(job.getHeadcount())
                .hiringManager(job.getHiringManager() != null ? toUserSummary(job.getHiringManager()) : null)
                .createdBy(job.getCreatedBy() != null ? toUserSummary(job.getCreatedBy()) : null)
                .publishedAt(job.getPublishedAt())
                .closingDate(job.getClosingDate())
                .createdAt(job.getCreatedAt())
                .updatedAt(job.getUpdatedAt())
                .build();
    }

    private JobSummaryResponse toJobSummaryResponse(Job job) {
        User hm = job.getHiringManager();
        return JobSummaryResponse.builder()
                .id(job.getId())
                .reqId(job.getReqId())
                .title(job.getTitle())
                .department(job.getDepartment())
                .location(job.getLocation())
                .workMode(job.getWorkMode())
                .jobType(job.getJobType())
                .seniorityLevel(job.getSeniorityLevel())
                .status(job.getStatus())
                .headcount(job.getHeadcount())
                .salaryMin(job.getSalaryMin())
                .salaryMax(job.getSalaryMax())
                .salaryCurrency(job.getSalaryCurrency())
                .hiringManagerName(hm != null ? hm.getFullName() : null)
                .hiringManagerAvatarUrl(hm != null ? hm.getAvatarUrl() : null)
                .publishedAt(job.getPublishedAt())
                .createdAt(job.getCreatedAt())
                .build();
    }

    private UserSummaryDto toUserSummary(User user) {
        return UserSummaryDto.builder()
                .id(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .email(user.getEmail())
                .avatarUrl(user.getAvatarUrl())
                .role(user.getRole())
                .build();
    }

    // ─── Specification Builder ─────────────────────────────────

    private Specification<Job> buildSpec(
            String search, JobStatus status, String department,
            WorkMode workMode, JobType jobType, SeniorityLevel seniorityLevel,
            String location, UUID hiringManagerId, UserPrincipal principal) {

        Specification<Job> spec = Specification.where(null);
        spec = spec.and(JobSpecification.hasStatus(status));
        spec = spec.and(JobSpecification.hasDepartment(department));
        spec = spec.and(JobSpecification.hasWorkMode(workMode));
        spec = spec.and(JobSpecification.hasJobType(jobType));
        spec = spec.and(JobSpecification.hasSeniorityLevel(seniorityLevel));
        spec = spec.and(JobSpecification.hasLocation(location));
        spec = spec.and(JobSpecification.titleOrDeptContains(search));

        // HIRING_MANAGER data scoping: can only see their own assigned jobs
        if (principal.getRole() == UserRole.HIRING_MANAGER) {
            spec = spec.and(JobSpecification.hasHiringManager(principal.getId()));
        } else if (hiringManagerId != null) {
            // ADMIN/RECRUITER may optionally filter by a specific HM
            spec = spec.and(JobSpecification.hasHiringManager(hiringManagerId));
        }

        return spec;
    }

    // ─── Internal Helpers ─────────────────────────────────────

    private Job loadJob(UUID jobId) {
        return jobRepository.findById(jobId)
                .orElseThrow(() -> new ResourceNotFoundException("Job", jobId));
    }

    private User loadUser(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));
    }

    /**
     * HIRING_MANAGER: may only access jobs where they are the assigned hiring manager.
     * ADMIN/RECRUITER: unrestricted access.
     */
    private void assertHiringManagerCanAccess(Job job, UserPrincipal principal) {
        if (principal.getRole() == UserRole.HIRING_MANAGER) {
            boolean isAssigned = job.getHiringManager() != null
                    && job.getHiringManager().getId().equals(principal.getId());
            if (!isAssigned) {
                // Return 404 instead of 403 to prevent information leakage
                throw new ResourceNotFoundException("Job", job.getId());
            }
        }
    }

    /**
     * Generate a unique requisition ID in the format RT-{YEAR}-{NNN}.
     * Uses prefix counting to determine the next sequential number.
     *
     * Thread safety: In high-concurrency scenarios, a unique constraint violation
     * may occur and should be retried by the caller. For MVP single-node deployment
     * this is acceptable. Use a DB SEQUENCE post-MVP.
     */
    private String generateReqId() {
        int year = Year.now().getValue();
        String prefix = "RT-" + year + "-";
        long count = jobRepository.countReqIdsWithPrefix(prefix);
        String candidate = prefix + String.format("%03d", count + 1);

        // Collision guard: if somehow already taken, increment further
        while (jobRepository.existsByReqId(candidate)) {
            count++;
            candidate = prefix + String.format("%03d", count + 1);
        }
        return candidate;
    }
}
