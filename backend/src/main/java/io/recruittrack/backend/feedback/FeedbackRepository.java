package io.recruittrack.backend.feedback;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface FeedbackRepository extends JpaRepository<Feedback, UUID> {

    @Query("""
            SELECT COUNT(f) > 0 FROM Feedback f
            WHERE f.interview.id = :interviewId
              AND f.interviewer.id = :interviewerId
            """)
    boolean existsByInterviewIdAndInterviewerId(@Param("interviewId") UUID interviewId, 
                                                @Param("interviewerId") UUID interviewerId);

    Page<Feedback> findAllByApplicationId(UUID applicationId, Pageable pageable);

    Page<Feedback> findAllByInterviewId(UUID interviewId, Pageable pageable);
}
