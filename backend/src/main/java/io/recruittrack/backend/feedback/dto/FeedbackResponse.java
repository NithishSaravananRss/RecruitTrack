package io.recruittrack.backend.feedback.dto;

import io.recruittrack.backend.applications.dto.ApplicationSummaryResponse;
import io.recruittrack.backend.common.dto.UserSummaryDto;
import io.recruittrack.backend.interviews.dto.InterviewSummaryResponse;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class FeedbackResponse {
    private UUID id;
    private InterviewSummaryResponse interview;
    private ApplicationSummaryResponse application;
    private UserSummaryDto interviewer;
    private String recommendation;
    private String overallComments;
    private List<RatingDto> ratings;
    private Instant createdAt;
    private Instant updatedAt;
}
