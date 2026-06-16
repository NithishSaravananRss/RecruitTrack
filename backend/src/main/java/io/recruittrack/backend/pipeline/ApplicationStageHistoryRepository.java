package io.recruittrack.backend.pipeline;

import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ApplicationStageHistoryRepository extends JpaRepository<ApplicationStageHistory, UUID> {
    
    List<ApplicationStageHistory> findAllByApplicationId(UUID applicationId, Sort sort);
}
