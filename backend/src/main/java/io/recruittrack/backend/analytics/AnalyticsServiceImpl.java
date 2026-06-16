package io.recruittrack.backend.analytics;

import io.recruittrack.backend.analytics.dto.*;
import io.recruittrack.backend.security.UserPrincipal;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AnalyticsServiceImpl implements AnalyticsService {

    private final EntityManager entityManager;

    @Override
    public DashboardSummaryResponse getDashboardSummary(UserPrincipal principal) {
        log.info("Fetching dashboard analytics summary");

        long totalJobs = count("SELECT COUNT(j) FROM Job j", principal, "j");
        long activeJobs = count("SELECT COUNT(j) FROM Job j WHERE j.status = 'ACTIVE'", principal, "j");
        long closedJobs = count("SELECT COUNT(j) FROM Job j WHERE j.status = 'CLOSED'", principal, "j");

        long totalCandidates = count("SELECT COUNT(c) FROM Candidate c", principal, "c");

        long totalApplications = count("SELECT COUNT(a) FROM Application a", principal, "a");
        long activeApplications = count("SELECT COUNT(a) FROM Application a WHERE a.isRejected = false", principal, "a");
        long totalOffers = count("SELECT COUNT(a) FROM Application a WHERE a.currentStage.stageType IN ('OFFER', 'HIRE')", principal, "a");
        long totalHires = count("SELECT COUNT(a) FROM Application a WHERE a.currentStage.stageType = 'HIRE'", principal, "a");
        long totalRejections = count("SELECT COUNT(a) FROM Application a WHERE a.isRejected = true", principal, "a");

        long scheduledInterviews = count("SELECT COUNT(i) FROM Interview i WHERE i.status = 'SCHEDULED'", principal, "i");
        long completedInterviews = count("SELECT COUNT(i) FROM Interview i WHERE i.status = 'COMPLETED'", principal, "i");

        return DashboardSummaryResponse.builder()
                .totalJobs(totalJobs)
                .activeJobs(activeJobs)
                .closedJobs(closedJobs)
                .totalCandidates(totalCandidates)
                .totalApplications(totalApplications)
                .activeApplications(activeApplications)
                .scheduledInterviews(scheduledInterviews)
                .completedInterviews(completedInterviews)
                .totalOffers(totalOffers)
                .totalHires(totalHires)
                .totalRejections(totalRejections)
                .build();
    }

    @Override
    @SuppressWarnings("unchecked")
    public List<PipelineAnalyticsResponse> getPipelineAnalytics(UserPrincipal principal) {
        log.info("Fetching pipeline analytics");

        String query = """
                SELECT p.name, COUNT(a.id)
                FROM PipelineStage p
                LEFT JOIN Application a ON a.currentStage.id = p.id
                """;
        if (principal != null && "HIRING_MANAGER".equals(principal.getRole().name())) {
            query += " AND a.job.hiringManager.id = :managerId \n";
        }
        query += """
                GROUP BY p.name, p.position
                ORDER BY p.position ASC
                """;

        var jpaQuery = entityManager.createQuery(query);
        if (principal != null && "HIRING_MANAGER".equals(principal.getRole().name())) {
            jpaQuery.setParameter("managerId", principal.getId());
        }

        List<Object[]> results = jpaQuery.getResultList();

        return results.stream()
                .map(row -> new PipelineAnalyticsResponse((String) row[0], ((Number) row[1]).longValue()))
                .collect(Collectors.toList());
    }

    @Override
    @SuppressWarnings("unchecked")
    public List<HiringFunnelResponse> getHiringFunnel(UserPrincipal principal) {
        log.info("Fetching hiring funnel analytics");

        // Assuming a linear funnel based on current snapshot for MVP
        // Total applications passing through a stage includes the current stage + all stages after it.
        String query = """
                SELECT p.name, COUNT(a.id)
                FROM PipelineStage p
                LEFT JOIN Application a ON a.currentStage.id = p.id
                """;
        if (principal != null && "HIRING_MANAGER".equals(principal.getRole().name())) {
            query += " AND a.job.hiringManager.id = :managerId \n";
        }
        query += """
                GROUP BY p.name, p.position
                ORDER BY p.position ASC
                """;

        var jpaQuery = entityManager.createQuery(query);
        if (principal != null && "HIRING_MANAGER".equals(principal.getRole().name())) {
            jpaQuery.setParameter("managerId", principal.getId());
        }

        List<Object[]> results = jpaQuery.getResultList();

        List<HiringFunnelResponse> funnel = new ArrayList<>();
        long runningTotal = 0;

        // Calculate cumulative totals backwards to represent the funnel
        long[] counts = new long[results.size()];
        for (int i = 0; i < results.size(); i++) {
            counts[i] = ((Number) results.get(i)[1]).longValue();
        }

        long[] cumulativeCounts = new long[results.size()];
        long sum = 0;
        for (int i = results.size() - 1; i >= 0; i--) {
            sum += counts[i];
            cumulativeCounts[i] = sum;
        }

        for (int i = 0; i < results.size(); i++) {
            String stageName = (String) results.get(i)[0];
            long currentCumulative = cumulativeCounts[i];
            long previousCumulative = (i == 0) ? currentCumulative : cumulativeCounts[i - 1];

            double conversion = 0.0;
            double dropOff = 0.0;

            if (previousCumulative > 0) {
                conversion = Math.round(((double) currentCumulative / previousCumulative) * 10000.0) / 100.0;
                dropOff = Math.round((100.0 - conversion) * 100.0) / 100.0;
            }

            if (i == 0 && currentCumulative > 0) {
                conversion = 100.0;
                dropOff = 0.0;
            }

            funnel.add(HiringFunnelResponse.builder()
                    .stageName(stageName)
                    .count(currentCumulative)
                    .conversionPercentage(conversion)
                    .dropOffPercentage(dropOff)
                    .build());
        }

        return funnel;
    }

    @Override
    @SuppressWarnings("unchecked")
    public JobAnalyticsResponse getJobAnalytics(UserPrincipal principal) {
        log.info("Fetching job analytics");

        long activeJobs = count("SELECT COUNT(j) FROM Job j WHERE j.status = 'OPEN'", principal, "j");
        long closedJobs = count("SELECT COUNT(j) FROM Job j WHERE j.status = 'CLOSED'", principal, "j");

        String appsPerJobQuery = """
                SELECT j.title, COUNT(a.id)
                FROM Job j
                LEFT JOIN Application a ON a.job.id = j.id
                """;
        if (principal != null && "HIRING_MANAGER".equals(principal.getRole().name())) {
            appsPerJobQuery += " WHERE j.hiringManager.id = :managerId \n";
        }
        appsPerJobQuery += """
                GROUP BY j.title
                ORDER BY COUNT(a.id) DESC
                """;

        var jpaQuery = entityManager.createQuery(appsPerJobQuery);
        if (principal != null && "HIRING_MANAGER".equals(principal.getRole().name())) {
            jpaQuery.setParameter("managerId", principal.getId());
        }

        List<Object[]> appsPerJobResults = jpaQuery.getResultList();

        List<AnalyticsMetricResponse> allAppsPerJob = appsPerJobResults.stream()
                .map(row -> new AnalyticsMetricResponse((String) row[0], ((Number) row[1]).longValue()))
                .collect(Collectors.toList());

        List<AnalyticsMetricResponse> top10 = allAppsPerJob.stream()
                .limit(10)
                .collect(Collectors.toList());

        List<String> noApps = allAppsPerJob.stream()
                .filter(metric -> metric.getValue() == 0)
                .map(AnalyticsMetricResponse::getLabel)
                .collect(Collectors.toList());

        return JobAnalyticsResponse.builder()
                .activeJobs(activeJobs)
                .closedJobs(closedJobs)
                .applicationsPerJob(allAppsPerJob)
                .topJobsByApplications(top10)
                .jobsWithNoApplications(noApps)
                .build();
    }

    private long count(String jpql, UserPrincipal principal, String alias) {
        String queryStr = jpql;
        if (principal != null && "HIRING_MANAGER".equals(principal.getRole().name())) {
            String condition = "";
            if ("j".equals(alias)) condition = "j.hiringManager.id = :managerId";
            else if ("c".equals(alias)) condition = "EXISTS (SELECT 1 FROM Application a2 WHERE a2.candidate = c AND a2.job.hiringManager.id = :managerId)";
            else if ("a".equals(alias)) condition = "a.job.hiringManager.id = :managerId";
            else if ("i".equals(alias)) condition = "i.application.job.hiringManager.id = :managerId";

            if (!condition.isEmpty()) {
                queryStr += queryStr.toLowerCase().contains("where") ? " AND " + condition : " WHERE " + condition;
            }
        }

        var query = entityManager.createQuery(queryStr);
        if (principal != null && "HIRING_MANAGER".equals(principal.getRole().name())) {
            query.setParameter("managerId", principal.getId());
        }
        return ((Number) query.getSingleResult()).longValue();
    }
}
