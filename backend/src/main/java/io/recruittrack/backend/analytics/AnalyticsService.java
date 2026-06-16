package io.recruittrack.backend.analytics;

import io.recruittrack.backend.analytics.dto.DashboardSummaryResponse;
import io.recruittrack.backend.analytics.dto.HiringFunnelResponse;
import io.recruittrack.backend.analytics.dto.JobAnalyticsResponse;
import io.recruittrack.backend.analytics.dto.PipelineAnalyticsResponse;

import java.util.List;

import io.recruittrack.backend.security.UserPrincipal;

public interface AnalyticsService {

    DashboardSummaryResponse getDashboardSummary(UserPrincipal principal);

    List<PipelineAnalyticsResponse> getPipelineAnalytics(UserPrincipal principal);

    List<HiringFunnelResponse> getHiringFunnel(UserPrincipal principal);

    JobAnalyticsResponse getJobAnalytics(UserPrincipal principal);
}
