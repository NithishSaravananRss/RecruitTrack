package io.recruittrack.backend.pipeline;

import io.recruittrack.backend.common.exception.BusinessRuleException;
import io.recruittrack.backend.common.exception.ErrorCode;
import io.recruittrack.backend.pipeline.dto.PipelineStageResponse;
import io.recruittrack.backend.pipeline.dto.UpdatePipelineOrderRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PipelineServiceImpl implements PipelineService {

    private final PipelineStageRepository pipelineStageRepository;

    @Override
    public List<PipelineStageResponse> getStages() {
        return pipelineStageRepository.findAllByOrderByPositionAsc().stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public void updateStagesOrder(UpdatePipelineOrderRequest request) {
        List<PipelineStage> stages = pipelineStageRepository.findAll();
        
        if (stages.size() != request.getStageIds().size()) {
            throw new BusinessRuleException(ErrorCode.VALIDATION_FAILED, "Must provide all stage IDs to reorder");
        }

        Map<UUID, PipelineStage> stageMap = stages.stream()
                .collect(Collectors.toMap(PipelineStage::getId, s -> s));

        for (int i = 0; i < request.getStageIds().size(); i++) {
            UUID id = request.getStageIds().get(i);
            PipelineStage stage = stageMap.get(id);
            if (stage == null) {
                throw new BusinessRuleException(ErrorCode.VALIDATION_FAILED, "Invalid stage ID provided: " + id);
            }
            stage.setPosition(i + 1);
        }

        pipelineStageRepository.saveAll(stages);
        log.info("Pipeline stages reordered");
    }

    private PipelineStageResponse toResponse(PipelineStage stage) {
        return PipelineStageResponse.builder()
                .id(stage.getId())
                .name(stage.getName())
                .stageType(stage.getStageType())
                .position(stage.getPosition())
                .build();
    }
}
