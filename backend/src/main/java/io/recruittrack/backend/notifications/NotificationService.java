package io.recruittrack.backend.notifications;

import io.recruittrack.backend.common.dto.PageResponse;
import io.recruittrack.backend.notifications.dto.NotificationResponse;
import io.recruittrack.backend.security.UserPrincipal;
import io.recruittrack.backend.users.User;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface NotificationService {

    void createNotification(User recipient, String message, UUID referenceId, String referenceType);

    PageResponse<NotificationResponse> getUserNotifications(Pageable pageable, UserPrincipal principal);

    NotificationResponse markAsRead(UUID notificationId, UserPrincipal principal);

    void markAllAsRead(UserPrincipal principal);
}
