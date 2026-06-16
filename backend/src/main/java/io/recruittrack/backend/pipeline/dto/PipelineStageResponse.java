package io.recruittrack.backend.pipeline.dto;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class PipelineStageResponse {
    private UUID id;
    private String name;
    private String stageType;
    private Integer position;
}
