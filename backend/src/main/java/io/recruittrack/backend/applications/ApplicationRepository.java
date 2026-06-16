package io.recruittrack.backend.applications;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface ApplicationRepository extends JpaRepository<Application, UUID> {

    @Query("""
            SELECT COUNT(a) > 0 FROM Application a
            WHERE a.candidate.id = :candidateId
              AND a.job.id = :jobId
              AND a.isRejected = false
            """)
    boolean existsActiveApplicationForCandidateAndJob(@Param("candidateId") UUID candidateId,
                                                      @Param("jobId") UUID jobId);

    Page<Application> findAllByJobId(UUID jobId, Pageable pageable);

    Page<Application> findAllByCandidateId(UUID candidateId, Pageable pageable);
}
