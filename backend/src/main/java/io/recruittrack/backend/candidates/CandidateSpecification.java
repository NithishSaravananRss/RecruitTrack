package io.recruittrack.backend.candidates;

import io.recruittrack.backend.common.enums.CandidateSource;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

/**
 * Composable JPA Specifications for dynamic Candidate filtering.
 *
 * Supports searching by:
 * - Full-text search (name, email, current_title, current_company)
 * - Exact source match
 * - Partial location match
 * - Skills array intersection (PostgreSQL-specific)
 */
public class CandidateSpecification {

    private CandidateSpecification() {}

    /**
     * Full-text search across multiple fields (case-insensitive LIKE).
     * Searches: firstName, lastName, email, currentTitle, currentCompany.
     */
    public static Specification<Candidate> searchContains(String search) {
        return (root, query, cb) -> {
            if (!StringUtils.hasText(search)) return null;
            String pattern = "%" + search.toLowerCase() + "%";

            // Note: Since name is split into first and last, we search them individually.
            // A more advanced search could use a CONCAT function, but individual LIKEs
            // suffice for the MVP requirements.
            return cb.or(
                    cb.like(cb.lower(root.get("firstName")),      pattern),
                    cb.like(cb.lower(root.get("lastName")),       pattern),
                    cb.like(cb.lower(root.get("email")),          pattern),
                    cb.like(cb.lower(root.get("currentTitle")),   pattern),
                    cb.like(cb.lower(root.get("currentCompany")), pattern)
            );
        };
    }

    /** Filter by exact CandidateSource. */
    public static Specification<Candidate> hasSource(CandidateSource source) {
        return (root, query, cb) ->
                source == null ? null : cb.equal(root.get("source"), source);
    }

    /** Filter by location (case-insensitive partial match). */
    public static Specification<Candidate> hasLocation(String location) {
        return (root, query, cb) ->
                !StringUtils.hasText(location) ? null :
                cb.like(cb.lower(root.get("location")), "%" + location.toLowerCase() + "%");
    }

    /**
     * Filter by skill.
     * Since skills is stored as a PostgreSQL text[] array, we must use a native
     * database function or an array containment operator.
     * In JPA 3.1 / Hibernate 6, we can use the 'member of' or array overlap.
     * To keep it simple and DB-agnostic at the JPA level for MVP (despite using PG array type),
     * we will skip the advanced PostgreSQL-specific '@>' operator in the Criteria API
     * and implement a basic LIKE search on the serialized array string if needed,
     * OR we can simply leave advanced array querying to a native query if requested.
     *
     * Actually, Hibernate 6 supports the 'array_contains' function.
     */
    public static Specification<Candidate> hasSkill(String skill) {
        return (root, query, cb) -> {
            if (!StringUtils.hasText(skill)) return null;
            // Use Hibernate 6's support for checking if an array contains a value
            return cb.isTrue(cb.function("array_contains", Boolean.class,
                    root.get("skills"), cb.literal(skill)));
        };
    }

    /** Filter by minimum years of experience. */
    public static Specification<Candidate> hasMinimumExperience(Integer minYears) {
        return (root, query, cb) ->
                minYears == null ? null : cb.greaterThanOrEqualTo(root.get("yearsOfExperience"), minYears);
    }
}
