package io.recruittrack.backend.analytics.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JobAnalyticsResponse {
    private long activeJobs;
    private long closedJobs;
    private List<AnalyticsMetricResponse> topJobsByApplications;
    private List<String> jobsWithNoApplications;
    private List<AnalyticsMetricResponse> applicationsPerJob;
}
