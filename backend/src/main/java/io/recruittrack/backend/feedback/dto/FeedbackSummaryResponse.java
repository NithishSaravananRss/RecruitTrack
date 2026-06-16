package io.recruittrack.backend.feedback.dto;

import io.recruittrack.backend.common.dto.UserSummaryDto;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class FeedbackSummaryResponse {
    private UUID id;
    private UUID interviewId;
    private UUID applicationId;
    private UserSummaryDto interviewer;
    private String recommendation;
    private Instant createdAt;
}
