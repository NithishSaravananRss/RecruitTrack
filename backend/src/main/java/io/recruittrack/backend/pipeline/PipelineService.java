package io.recruittrack.backend.pipeline;

import io.recruittrack.backend.pipeline.dto.PipelineStageResponse;
import io.recruittrack.backend.pipeline.dto.UpdatePipelineOrderRequest;

import java.util.List;
import java.util.UUID;

public interface PipelineService {

    List<PipelineStageResponse> getStages();

    void updateStagesOrder(UpdatePipelineOrderRequest request);
}
