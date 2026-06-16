package io.recruittrack.backend.jobs.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import io.recruittrack.backend.common.enums.*;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;



/**
 * Compact job representation for list views — returned by GET /api/v1/jobs.
 *
 * Lighter than JobResponse: omits description, requirements, responsibilities
 * to reduce payload size on list queries with potentially hundreds of results.
 *
 * The frontend uses this for the Jobs table and Kanban board.
 * When the user opens a job, the full JobResponse is loaded via GET /jobs/{jobId}.
 */
@Data
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class JobSummaryResponse {

    private UUID           id;
    private String         reqId;
    private String         title;
    private String         department;
    private String         location;
    private WorkMode       workMode;
    private JobType        jobType;
    private SeniorityLevel seniorityLevel;
    private JobStatus      status;
    private Integer        headcount;
    private BigDecimal     salaryMin;
    private BigDecimal     salaryMax;
    private String         salaryCurrency;

    /** Hiring manager's full name for display. Null if unassigned. */
    private String         hiringManagerName;
    private String         hiringManagerAvatarUrl;

    private Instant        publishedAt;
    private Instant        createdAt;
}
