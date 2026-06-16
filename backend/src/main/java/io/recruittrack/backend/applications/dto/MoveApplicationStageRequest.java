package io.recruittrack.backend.applications.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class MoveApplicationStageRequest {
    
    @NotNull(message = "Target stage ID is required")
    private UUID stageId;
    
    private String notes;
}
