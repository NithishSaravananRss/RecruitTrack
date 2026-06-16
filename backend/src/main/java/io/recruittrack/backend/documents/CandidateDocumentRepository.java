package io.recruittrack.backend.documents;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CandidateDocumentRepository extends JpaRepository<CandidateDocument, UUID> {

    Page<CandidateDocument> findAllByCandidateId(UUID candidateId, Pageable pageable);

    Optional<CandidateDocument> findByCandidateIdAndIsLatestResumeTrue(UUID candidateId);

    @Modifying
    @Query("""
            UPDATE CandidateDocument d
            SET d.isLatestResume = false, d.updatedAt = :now
            WHERE d.candidate.id = :candidateId AND d.isLatestResume = true
            """)
    void unsetLatestResumeForCandidate(@Param("candidateId") UUID candidateId, @Param("now") Instant now);
    
    @Modifying(clearAutomatically = true)
    @Query("""
            UPDATE CandidateDocument d
            SET d.deletedAt = :now,
                d.deletedBy = :deletedBy,
                d.updatedAt = :now,
                d.isLatestResume = false
            WHERE d.id = :documentId
            """)
    void softDeleteById(@Param("documentId") UUID documentId,
                        @Param("deletedBy") io.recruittrack.backend.users.User deletedBy,
                        @Param("now") Instant now);
}
