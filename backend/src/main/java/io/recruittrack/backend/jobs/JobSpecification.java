package io.recruittrack.backend.jobs;

import io.recruittrack.backend.common.enums.JobStatus;
import io.recruittrack.backend.common.enums.JobType;
import io.recruittrack.backend.common.enums.SeniorityLevel;
import io.recruittrack.backend.common.enums.WorkMode;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.util.UUID;

/**
 * Composable JPA Specifications for dynamic Job filtering.
 *
 * Usage in service layer:
 * <pre>
 *   Specification<Job> spec = Specification.where(null);
 *   spec = spec.and(JobSpecification.hasStatus(status));
 *   spec = spec.and(JobSpecification.titleContains(search));
 *   page = jobRepository.findAll(spec, pageable);
 * </pre>
 *
 * Each method returns null (i.e., no filter) when the parameter is absent,
 * so unspecified filters are automatically ignored.
 */
public class JobSpecification {

    private JobSpecification() {}

    /** Filter by exact status. */
    public static Specification<Job> hasStatus(JobStatus status) {
        return (root, query, cb) ->
                status == null ? null : cb.equal(root.get("status"), status);
    }

    /** Filter by department (case-insensitive LIKE). */
    public static Specification<Job> hasDepartment(String department) {
        return (root, query, cb) ->
                !StringUtils.hasText(department) ? null :
                cb.like(cb.lower(root.get("department")),
                        "%" + department.toLowerCase() + "%");
    }

    /** Filter by location (case-insensitive LIKE). */
    public static Specification<Job> hasLocation(String location) {
        return (root, query, cb) ->
                !StringUtils.hasText(location) ? null :
                cb.like(cb.lower(root.get("location")),
                        "%" + location.toLowerCase() + "%");
    }

    /** Filter by work mode. */
    public static Specification<Job> hasWorkMode(WorkMode workMode) {
        return (root, query, cb) ->
                workMode == null ? null : cb.equal(root.get("workMode"), workMode);
    }

    /** Filter by job type. */
    public static Specification<Job> hasJobType(JobType jobType) {
        return (root, query, cb) ->
                jobType == null ? null : cb.equal(root.get("jobType"), jobType);
    }

    /** Filter by seniority level. */
    public static Specification<Job> hasSeniorityLevel(SeniorityLevel level) {
        return (root, query, cb) ->
                level == null ? null : cb.equal(root.get("seniorityLevel"), level);
    }

    /**
     * Filter to jobs owned by a specific hiring manager.
     * Used for HIRING_MANAGER data scoping — they see only their own jobs.
     */
    public static Specification<Job> hasHiringManager(UUID hiringManagerId) {
        return (root, query, cb) ->
                hiringManagerId == null ? null :
                cb.equal(root.get("hiringManager").get("id"), hiringManagerId);
    }

    /**
     * Full-text search on job title (case-insensitive LIKE).
     * Searches across: title, department, location.
     */
    public static Specification<Job> titleOrDeptContains(String search) {
        return (root, query, cb) -> {
            if (!StringUtils.hasText(search)) return null;
            String pattern = "%" + search.toLowerCase() + "%";
            return cb.or(
                    cb.like(cb.lower(root.get("title")),      pattern),
                    cb.like(cb.lower(root.get("department")), pattern),
                    cb.like(cb.lower(root.get("location")),   pattern)
            );
        };
    }

    /** Exclude jobs without an assigned hiring manager. */
    public static Specification<Job> hasHiringManagerAssigned() {
        return (root, query, cb) -> cb.isNotNull(root.get("hiringManager"));
    }
}
