package io.recruittrack.backend.analytics.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class DashboardSummaryResponse {
    private long totalJobs;
    private long activeJobs;
    private long closedJobs;
    private long totalCandidates;
    private long totalApplications;
    private long activeApplications;
    private long scheduledInterviews;
    private long completedInterviews;
    private long totalOffers;
    private long totalHires;
    private long totalRejections;
}
