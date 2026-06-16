package io.recruittrack.backend.applications.dto;

import io.recruittrack.backend.pipeline.dto.PipelineStageResponse;
import io.recruittrack.backend.candidates.dto.CandidateSummaryResponse;
import io.recruittrack.backend.jobs.dto.JobSummaryResponse;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class ApplicationSummaryResponse {
    private UUID id;
    private CandidateSummaryResponse candidate;
    private JobSummaryResponse job;
    private PipelineStageResponse currentStage;
    private Boolean isRejected;
    private Instant appliedAt;
}
