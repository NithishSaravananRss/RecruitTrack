package io.recruittrack.backend.audit;

import java.util.Map;
import java.util.UUID;

public interface SystemAuditLogService {
    
    void logAction(String actionType, String entityType, UUID entityId, UUID userId, String userName, String description, Map<String, Object> metadata);

}
