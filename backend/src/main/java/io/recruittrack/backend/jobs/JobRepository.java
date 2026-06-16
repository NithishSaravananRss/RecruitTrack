package io.recruittrack.backend.jobs;

import io.recruittrack.backend.common.enums.JobStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.UUID;

/**
 * Spring Data JPA repository for the Job entity.
 *
 * Extends JpaSpecificationExecutor to support dynamic filtering via Specifications
 * (used for status, department, workMode, hiring manager scoping, search).
 *
 * All queries automatically apply @SQLRestriction("deleted_at IS NULL").
 */
@Repository
public interface JobRepository extends JpaRepository<Job, UUID>, JpaSpecificationExecutor<Job> {

    /**
     * Count jobs whose req_id starts with the given prefix.
     * Used by ReqIdGenerator to determine the next sequential number.
     * NOTE: Must use a native query to bypass @SQLRestriction so deleted jobs
     *       are also counted — otherwise req_id numbers would be recycled.
     */
    @Query(value = "SELECT COUNT(*) FROM jobs WHERE req_id LIKE :prefix%",
           nativeQuery = true)
    long countReqIdsWithPrefix(@Param("prefix") String prefix);

    /** Prevent duplicate req_ids. */
    boolean existsByReqId(String reqId);

    /**
     * Check if a job has any non-deleted applications.
     * Used before allowing job deletion.
     * Implemented as a native query since the schema is frozen.
     */
    @Query(value = """
            SELECT COUNT(*) > 0
            FROM applications
            WHERE job_id = :jobId AND deleted_at IS NULL
            """, nativeQuery = true)
    boolean hasActiveApplications(@Param("jobId") UUID jobId);

    /** Soft delete — sets deleted_at and deleted_by. */
    @Modifying(clearAutomatically = true)
    @Query("""
            UPDATE Job j
            SET j.deletedAt = :now,
                j.deletedBy = :deletedBy,
                j.updatedAt = :now
            WHERE j.id = :jobId
            """)
    void softDeleteById(@Param("jobId") UUID jobId,
                        @Param("deletedBy") io.recruittrack.backend.users.User deletedBy,
                        @Param("now") Instant now);
}
