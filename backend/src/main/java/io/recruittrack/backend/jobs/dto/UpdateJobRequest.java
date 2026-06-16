package io.recruittrack.backend.jobs.dto;

import io.recruittrack.backend.common.enums.*;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Request body for PUT /api/v1/jobs/{jobId}
 *
 * Full replacement of all mutable job fields.
 * Status is NOT included — use PATCH /jobs/{jobId}/status for status transitions.
 * Only ADMIN and RECRUITER may call this endpoint.
 */
@Data
public class UpdateJobRequest {

    @NotBlank(message = "Job title is required")
    @Size(max = 255, message = "Title must not exceed 255 characters")
    private String title;

    @Size(max = 150, message = "Department must not exceed 150 characters")
    private String department;

    @Size(max = 255, message = "Location must not exceed 255 characters")
    private String location;

    private WorkMode workMode;

    private JobType jobType;

    private SeniorityLevel seniorityLevel;

    private String description;

    private String requirements;

    private String responsibilities;

    @DecimalMin(value = "0", message = "Salary minimum must be non-negative")
    private BigDecimal salaryMin;

    @DecimalMin(value = "0", message = "Salary maximum must be non-negative")
    private BigDecimal salaryMax;

    @Size(max = 10, message = "Currency code must not exceed 10 characters")
    private String salaryCurrency;

    @Min(value = 1, message = "Headcount must be at least 1")
    private Integer headcount;

    /** Pass null to remove the hiring manager assignment. */
    private UUID hiringManagerId;

    private LocalDate closingDate;
}
