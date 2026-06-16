package io.recruittrack.backend.audit;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class SystemAuditLogServiceImpl implements SystemAuditLogService {

    private final SystemAuditLogRepository auditLogRepository;

    @Override
    @Transactional(propagation = Propagation.MANDATORY)
    public void logAction(String actionType, String entityType, UUID entityId, UUID userId, String userName, String description, Map<String, Object> metadata) {
        SystemAuditLog logEntry = SystemAuditLog.builder()
                .actionType(actionType)
                .entityType(entityType)
                .entityId(entityId)
                .userId(userId)
                .userName(userName)
                .description(description)
                .metadata(metadata)
                .timestamp(Instant.now())
                .build();
                
        auditLogRepository.save(logEntry);
        log.debug("Audit log saved: {} on {} by {}", actionType, entityType, userName);
    }
}
