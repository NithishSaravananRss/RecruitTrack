package io.recruittrack.backend.candidates.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import io.recruittrack.backend.common.enums.CandidateSource;
import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.UUID;

/**
 * Compact candidate representation for list views.
 */
@Data
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class CandidateSummaryResponse {

    private UUID            id;
    private String          firstName;
    private String          lastName;
    private String          email;
    private String          currentTitle;
    private String          currentCompany;
    private List<String>    skills;
    private CandidateSource source;
    private String          avatarUrl;
    private String          resumeUrl;
    private String          phone;
    private String          location;
    private java.math.BigDecimal yearsOfExperience;
    private java.math.BigDecimal expectedSalaryMin;
    private java.math.BigDecimal expectedSalaryMax;
    private String          salaryCurrency;
    private Integer         matchScore;

    public String getFullName() {
        return firstName + " " + lastName;
    }
}
