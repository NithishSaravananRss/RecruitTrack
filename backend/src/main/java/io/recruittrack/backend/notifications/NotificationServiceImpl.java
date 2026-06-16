package io.recruittrack.backend.notifications;

import io.recruittrack.backend.common.dto.PageResponse;
import io.recruittrack.backend.common.exception.BusinessRuleException;
import io.recruittrack.backend.common.exception.ErrorCode;
import io.recruittrack.backend.common.exception.ResourceNotFoundException;
import io.recruittrack.backend.notifications.dto.NotificationResponse;
import io.recruittrack.backend.security.UserPrincipal;
import io.recruittrack.backend.users.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;

    @Override
    @Transactional
    public void createNotification(User recipient, String message, UUID referenceId, String referenceType) {
        Notification notification = Notification.builder()
                .user(recipient)
                .message(message)
                .referenceId(referenceId)
                .referenceType(referenceType)
                .build();
        
        notification = notificationRepository.save(notification);
        log.info("Notification created: id={}, userId={}", notification.getId(), recipient.getId());
    }

    @Override
    public PageResponse<NotificationResponse> getUserNotifications(Pageable pageable, UserPrincipal principal) {
        Page<Notification> page = notificationRepository.findAllByUserId(principal.getId(), pageable);
        return PageResponse.from(page.map(this::toResponse));
    }

    @Override
    @Transactional
    public NotificationResponse markAsRead(UUID notificationId, UserPrincipal principal) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification", notificationId));

        if (!notification.getUser().getId().equals(principal.getId())) {
            throw new BusinessRuleException(ErrorCode.UNAUTHORIZED, "You can only modify your own notifications");
        }

        notification.setIsRead(true);
        notification = notificationRepository.save(notification);
        log.info("Notification read: id={}", notification.getId());

        return toResponse(notification);
    }

    @Override
    @Transactional
    public void markAllAsRead(UserPrincipal principal) {
        notificationRepository.markAllAsReadForUser(principal.getId());
        log.info("All notifications marked as read for userId={}", principal.getId());
    }

    private NotificationResponse toResponse(Notification notification) {
        return NotificationResponse.builder()
                .id(notification.getId())
                .message(notification.getMessage())
                .isRead(notification.getIsRead())
                .referenceId(notification.getReferenceId())
                .referenceType(notification.getReferenceType())
                .createdAt(notification.getCreatedAt())
                .build();
    }
}
