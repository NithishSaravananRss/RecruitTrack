package io.recruittrack.backend.jobs;

import io.recruittrack.backend.common.dto.PageResponse;
import io.recruittrack.backend.common.enums.*;
import io.recruittrack.backend.jobs.dto.*;
import io.recruittrack.backend.security.UserPrincipal;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

/**
 * Contract for the Jobs business module.
 *
 * All methods receive the authenticated UserPrincipal for:
 * - Setting created_by on creation
 * - Enforcing HIRING_MANAGER data scoping on reads
 * - Authorization checks that go beyond @PreAuthorize role checks
 */
public interface JobService {

    /** Create a new job posting. Status defaults to DRAFT if not specified. */
    JobResponse createJob(CreateJobRequest request, UserPrincipal principal);

    /**
     * List jobs with dynamic filtering and pagination.
     * HIRING_MANAGERs automatically see only their assigned jobs.
     */
    PageResponse<JobSummaryResponse> getJobs(
            String search,
            JobStatus status,
            String department,
            WorkMode workMode,
            JobType jobType,
            SeniorityLevel seniorityLevel,
            String location,
            UUID hiringManagerId,
            Pageable pageable,
            UserPrincipal principal);

    /**
     * Get a single job by ID.
     * HIRING_MANAGERs may only retrieve jobs where they are the hiring manager.
     */
    JobResponse getJob(UUID jobId, UserPrincipal principal);

    /**
     * Full update of all mutable job fields.
     * Only ADMIN and RECRUITER may call this.
     */
    JobResponse updateJob(UUID jobId, UpdateJobRequest request, UserPrincipal principal);

    /**
     * Transition job status through the state machine.
     * DRAFT → ACTIVE sets published_at.
     */
    JobResponse updateJobStatus(UUID jobId, UpdateJobStatusRequest request, UserPrincipal principal);

    /**
     * Soft delete a job.
     * Only ADMIN may call this.
     * Jobs with active applications cannot be deleted (enforced in Phase 7).
     */
    void deleteJob(UUID jobId, UserPrincipal principal);
}
