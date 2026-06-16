package io.recruittrack.backend.jobs.dto;

import io.recruittrack.backend.common.enums.JobStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * Request body for PATCH /api/v1/jobs/{jobId}/status
 *
 * Triggers the job status state machine.
 * Valid transitions are enforced by JobStatus.canTransitionTo().
 *
 * Only ADMIN and RECRUITER may call this endpoint.
 */
@Data
public class UpdateJobStatusRequest {

    @NotNull(message = "Target status is required")
    private JobStatus status;

    /**
     * Optional reason for the status change.
     * Useful for CLOSED/ARCHIVED transitions to capture context.
     * Stored in activity_logs in Phase 10.
     */
    private String reason;
}
