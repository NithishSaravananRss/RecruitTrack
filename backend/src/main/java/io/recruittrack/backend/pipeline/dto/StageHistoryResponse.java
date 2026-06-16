package io.recruittrack.backend.pipeline.dto;

import io.recruittrack.backend.common.dto.UserSummaryDto;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class StageHistoryResponse {
    private UUID id;
    private PipelineStageResponse fromStage;
    private PipelineStageResponse toStage;
    private UserSummaryDto movedBy;
    private String notes;
    private Instant movedAt;
}
