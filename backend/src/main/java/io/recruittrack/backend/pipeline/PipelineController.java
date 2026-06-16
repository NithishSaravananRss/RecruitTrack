package io.recruittrack.backend.pipeline;

import io.recruittrack.backend.common.dto.ApiResponse;
import io.recruittrack.backend.pipeline.dto.PipelineStageResponse;
import io.recruittrack.backend.pipeline.dto.UpdatePipelineOrderRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/jobs")
@RequiredArgsConstructor
public class PipelineController {

    private final PipelineService pipelineService;

    // Notice: Based on the requested API paths "GET /api/v1/jobs/{jobId}/pipeline" and
    // "GET /api/v1/jobs/{jobId}/stages", we're designing this for flexibility,
    // though for MVP stages are global so jobId might just be ignored or
    // validated. For simplicity, we expose global stages if the UI just needs the stages.

    @GetMapping("/{jobId}/pipeline-stages")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECRUITER', 'HIRING_MANAGER')")
    public ResponseEntity<ApiResponse<List<PipelineStageResponse>>> getPipelineStages(
            @PathVariable String jobId) {
        return ResponseEntity.ok(ApiResponse.success(pipelineService.getStages()));
    }

    @PutMapping("/{jobId}/pipeline-stages/reorder")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECRUITER')")
    public ResponseEntity<ApiResponse<Void>> updatePipelineStagesOrder(
            @PathVariable String jobId,
            @Valid @RequestBody UpdatePipelineOrderRequest request) {
        pipelineService.updateStagesOrder(request);
        return ResponseEntity.ok(ApiResponse.success(null, "Pipeline stages reordered"));
    }
}
