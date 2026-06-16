package io.recruittrack.backend.notes;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.UUID;

@Repository
public interface CandidateNoteRepository extends JpaRepository<CandidateNote, UUID> {

    @Query("""
            SELECT n FROM CandidateNote n
            WHERE n.candidate.id = :candidateId
              AND (n.isPrivate = false OR n.createdBy.id = :userId OR :isAdmin = true)
            """)
    Page<CandidateNote> findVisibleNotesForCandidate(
            @Param("candidateId") UUID candidateId,
            @Param("userId") UUID userId,
            @Param("isAdmin") boolean isAdmin,
            Pageable pageable);

    @Modifying(clearAutomatically = true)
    @Query("""
            UPDATE CandidateNote n
            SET n.deletedAt = :now,
                n.deletedBy = :deletedBy,
                n.updatedAt = :now
            WHERE n.id = :noteId
            """)
    void softDeleteById(@Param("noteId") UUID noteId,
                        @Param("deletedBy") io.recruittrack.backend.users.User deletedBy,
                        @Param("now") Instant now);
}
