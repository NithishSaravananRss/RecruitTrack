package io.recruittrack.backend.feedback.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
public class SubmitFeedbackRequest {

    @NotNull(message = "Interview ID is required")
    private UUID interviewId;

    @NotBlank(message = "Recommendation is required")
    private String recommendation;

    private String overallComments;

    @Valid
    private List<RatingDto> ratings;
}
