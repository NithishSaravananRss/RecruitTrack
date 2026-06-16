package io.recruittrack.backend.pipeline.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
public class UpdatePipelineOrderRequest {
    
    @NotEmpty(message = "Stage order list cannot be empty")
    private List<UUID> stageIds;
}
