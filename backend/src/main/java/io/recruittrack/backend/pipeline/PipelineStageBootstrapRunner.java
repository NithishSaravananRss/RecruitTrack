package io.recruittrack.backend.pipeline;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
@Order(2)
public class PipelineStageBootstrapRunner implements CommandLineRunner {

    private final PipelineStageRepository pipelineStageRepository;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        if (pipelineStageRepository.count() == 0) {
            log.info("No pipeline stages found. Bootstrapping default stages...");
            
            List<PipelineStage> stages = List.of(
                PipelineStage.builder().name("Applied").stageType("APPLIED").position(1).build(),
                PipelineStage.builder().name("Screening").stageType("SCREENING").position(2).build(),
                PipelineStage.builder().name("Technical").stageType("TECHNICAL").position(3).build(),
                PipelineStage.builder().name("Manager").stageType("MANAGER").position(4).build(),
                PipelineStage.builder().name("HR Round").stageType("HR_ROUND").position(5).build(),
                PipelineStage.builder().name("Offer").stageType("OFFER").position(6).build(),
                PipelineStage.builder().name("Hired").stageType("HIRE").position(7).build(),
                PipelineStage.builder().name("Rejected").stageType("REJECT").position(8).build()
            );
            
            pipelineStageRepository.saveAll(stages);
            log.info("Successfully seeded {} default pipeline stages.", stages.size());
        }
    }
}
