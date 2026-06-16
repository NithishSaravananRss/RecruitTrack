package io.recruittrack.backend.interviews.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Data
public class UpdateInterviewRequest {

    @NotNull(message = "Stage ID is required")
    private UUID stageId;

    @NotNull(message = "Scheduled time is required")
    @Future(message = "Scheduled time must be in the future")
    private Instant scheduledAt;

    @NotNull(message = "Duration is required")
    @Min(value = 1, message = "Duration must be greater than zero")
    private Integer durationMinutes;

    private String location;

    private String meetingLink;

    private String instructions;

    @NotEmpty(message = "Interviewer list cannot be empty")
    private List<UUID> interviewerIds;
}
