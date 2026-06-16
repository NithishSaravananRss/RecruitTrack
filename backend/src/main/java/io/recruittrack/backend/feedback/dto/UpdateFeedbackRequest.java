package io.recruittrack.backend.feedback.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.List;

@Data
public class UpdateFeedbackRequest {

    @NotBlank(message = "Recommendation is required")
    private String recommendation;

    private String overallComments;

    @Valid
    private List<RatingDto> ratings;
}
