package io.recruittrack.backend.analytics;

import io.recruittrack.backend.analytics.dto.DashboardSummaryResponse;
import io.recruittrack.backend.analytics.dto.HiringFunnelResponse;
import io.recruittrack.backend.analytics.dto.JobAnalyticsResponse;
import io.recruittrack.backend.analytics.dto.PipelineAnalyticsResponse;
import io.recruittrack.backend.common.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

import io.recruittrack.backend.security.UserPrincipal;
import org.springframework.security.core.annotation.AuthenticationPrincipal;

@RestController
@RequestMapping("/api/v1/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping("/dashboard")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECRUITER', 'HIRING_MANAGER')")
    public ResponseEntity<ApiResponse<DashboardSummaryResponse>> getDashboardSummary(@AuthenticationPrincipal UserPrincipal principal) {
        DashboardSummaryResponse response = analyticsService.getDashboardSummary(principal);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/pipeline")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECRUITER', 'HIRING_MANAGER')")
    public ResponseEntity<ApiResponse<List<PipelineAnalyticsResponse>>> getPipelineAnalytics(@AuthenticationPrincipal UserPrincipal principal) {
        List<PipelineAnalyticsResponse> response = analyticsService.getPipelineAnalytics(principal);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/hiring-funnel")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECRUITER', 'HIRING_MANAGER')")
    public ResponseEntity<ApiResponse<List<HiringFunnelResponse>>> getHiringFunnel(@AuthenticationPrincipal UserPrincipal principal) {
        List<HiringFunnelResponse> response = analyticsService.getHiringFunnel(principal);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/jobs")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECRUITER', 'HIRING_MANAGER')")
    public ResponseEntity<ApiResponse<JobAnalyticsResponse>> getJobAnalytics(@AuthenticationPrincipal UserPrincipal principal) {
        JobAnalyticsResponse response = analyticsService.getJobAnalytics(principal);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
