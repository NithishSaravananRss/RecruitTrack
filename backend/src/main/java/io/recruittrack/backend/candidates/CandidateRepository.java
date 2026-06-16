package io.recruittrack.backend.candidates;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.UUID;

/**
 * Spring Data JPA repository for the Candidate entity.
 *
 * Extends JpaSpecificationExecutor for dynamic search filtering
 * (name, email, skills, source, location).
 *
 * All queries apply @SQLRestriction("deleted_at IS NULL") automatically.
 */
@Repository
public interface CandidateRepository
        extends JpaRepository<Candidate, UUID>, JpaSpecificationExecutor<Candidate> {

    /**
     * Prevent duplicate candidates by email.
     * Called before creating a new candidate.
     */
    boolean existsByEmailIgnoreCase(String email);

    /**
     * Find candidate by email — used to detect conflicts on update.
     * Returns true if another candidate (different ID) already has this email.
     */
    @Query("""
            SELECT COUNT(c) > 0
            FROM Candidate c
            WHERE LOWER(c.email) = LOWER(:email)
              AND c.id <> :candidateId
            """)
    boolean existsByEmailIgnoreCaseAndIdNot(@Param("email") String email,
                                            @Param("candidateId") UUID candidateId);

    /** Soft delete — sets deleted_at and deleted_by. */
    @Modifying(clearAutomatically = true)
    @Query("""
            UPDATE Candidate c
            SET c.deletedAt = :now,
                c.deletedBy = :deletedBy,
                c.updatedAt = :now
            WHERE c.id = :candidateId
            """)
    void softDeleteById(@Param("candidateId") UUID candidateId,
                        @Param("deletedBy") io.recruittrack.backend.users.User deletedBy,
                        @Param("now") Instant now);
}
