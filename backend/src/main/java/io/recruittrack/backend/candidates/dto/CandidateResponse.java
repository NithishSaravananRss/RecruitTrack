package io.recruittrack.backend.candidates.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import io.recruittrack.backend.common.dto.UserSummaryDto;
import io.recruittrack.backend.common.enums.CandidateSource;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Full candidate detail response.
 */
@Data
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class CandidateResponse {

    private UUID            id;
    private String          firstName;
    private String          lastName;
    private String          email;
    private String          phone;
    private String          location;
    private String          currentTitle;
    private String          currentCompany;
    private BigDecimal      yearsOfExperience;
    private String          linkedinUrl;
    private String          portfolioUrl;
    private List<String>    skills;
    private CandidateSource source;
    private String          sourceDetail;
    private String          resumeUrl;
    private String          avatarUrl;
    private String          notes;
    private BigDecimal      expectedSalaryMin;
    private BigDecimal      expectedSalaryMax;
    private String          salaryCurrency;
    private UserSummaryDto  createdBy;
    private Instant         createdAt;
    private Instant         updatedAt;
    private Integer         matchScore;
}
