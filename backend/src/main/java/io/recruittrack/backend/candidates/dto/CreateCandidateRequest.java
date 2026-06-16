package io.recruittrack.backend.candidates.dto;

import io.recruittrack.backend.common.enums.CandidateSource;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

/**
 * Request body for POST /api/v1/candidates
 *
 * Only ADMIN, RECRUITER, and HIRING_MANAGER may create candidates.
 */
@Data
public class CreateCandidateRequest {

    @NotBlank(message = "First name is required")
    @Size(max = 100, message = "First name must not exceed 100 characters")
    private String firstName;

    @NotBlank(message = "Last name is required")
    @Size(max = 100, message = "Last name must not exceed 100 characters")
    private String lastName;

    @NotBlank(message = "Email is required")
    @Email(message = "Must be a valid email address")
    @Size(max = 320, message = "Email must not exceed 320 characters")
    private String email;

    @Size(max = 30, message = "Phone must not exceed 30 characters")
    private String phone;

    @Size(max = 255, message = "Location must not exceed 255 characters")
    private String location;

    @Size(max = 150, message = "Current title must not exceed 150 characters")
    private String currentTitle;

    @Size(max = 150, message = "Current company must not exceed 150 characters")
    private String currentCompany;

    private BigDecimal yearsOfExperience;

    private String linkedinUrl;

    private String portfolioUrl;

    private List<String> skills;

    private CandidateSource source;

    @Size(max = 255, message = "Source detail must not exceed 255 characters")
    private String sourceDetail;

    private String resumeUrl;

    private String avatarUrl;

    private String notes;

    private BigDecimal expectedSalaryMin;

    private BigDecimal expectedSalaryMax;

    @Size(max = 10, message = "Currency code must not exceed 10 characters")
    private String salaryCurrency;
}
