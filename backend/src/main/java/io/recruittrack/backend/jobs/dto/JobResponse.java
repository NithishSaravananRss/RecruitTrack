package io.recruittrack.backend.jobs.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import io.recruittrack.backend.common.dto.UserSummaryDto;
import io.recruittrack.backend.common.enums.*;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Full job detail response — returned by:
 * - POST /api/v1/jobs (on creation)
 * - GET  /api/v1/jobs/{jobId}
 * - PUT  /api/v1/jobs/{jobId}
 * - PATCH /api/v1/jobs/{jobId}/status
 *
 * Embeds hiringManager and createdBy as UserSummaryDto to avoid
 * requiring additional API calls from the frontend.
 *
 * applicationCount is omitted until Phase 7 (Applications module).
 */
@Data
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class JobResponse {

    private UUID           id;
    private String         reqId;
    private String         title;
    private String         department;
    private String         location;
    private WorkMode       workMode;
    private JobType        jobType;
    private SeniorityLevel seniorityLevel;
    private JobStatus      status;
    private String         description;
    private String         requirements;
    private String         responsibilities;
    private BigDecimal     salaryMin;
    private BigDecimal     salaryMax;
    private String         salaryCurrency;
    private Integer        headcount;
    private UserSummaryDto hiringManager;
    private UserSummaryDto createdBy;
    private Instant        publishedAt;
    private LocalDate      closingDate;
    private Instant        createdAt;
    private Instant        updatedAt;
}
