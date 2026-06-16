package io.recruittrack.backend.notifications.dto;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class NotificationResponse {
    private UUID id;
    private String message;
    private Boolean isRead;
    private UUID referenceId;
    private String referenceType;
    private Instant createdAt;
}
