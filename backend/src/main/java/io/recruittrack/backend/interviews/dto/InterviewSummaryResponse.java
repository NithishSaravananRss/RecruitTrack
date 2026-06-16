package io.recruittrack.backend.interviews.dto;

import io.recruittrack.backend.common.enums.InterviewStatus;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class InterviewSummaryResponse {
    private UUID id;
    private UUID applicationId;
    private String candidateName;
    private String jobTitle;
    private String stageName;
    private InterviewStatus status;
    private Instant scheduledAt;
    private Integer durationMinutes;
}
