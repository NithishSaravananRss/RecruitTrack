package io.recruittrack.backend.users;

import io.recruittrack.backend.common.enums.UserRole;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.SQLRestriction;

import java.time.Instant;
import java.util.UUID;

/**
 * JPA entity for the 'users' table.
 * Schema: approved Phase 2 database design — frozen.
 *
 * Soft delete: @SQLRestriction("deleted_at IS NULL") ensures all queries
 * automatically exclude soft-deleted users. The application never hard-deletes users.
 *
 * Self-referential FKs:
 * - invited_by → the admin/recruiter who sent the invitation
 * - deleted_by → the admin who deactivated this user (future)
 *
 * Note: password_hash is NULL for SSO users (sso_provider IS NOT NULL).
 */
@Entity
@Table(name = "users")
@SQLRestriction("deleted_at IS NULL")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    @Column(nullable = false, unique = true, length = 320)
    private String email;

    /**
     * BCrypt-hashed password. NULL for SSO users.
     * Never expose in any response DTO — excluded by convention in all mappers.
     */
    @Column(name = "password_hash", length = 255)
    private String passwordHash;

    @Column(name = "first_name", nullable = false, length = 100)
    private String firstName;

    @Column(name = "last_name", nullable = false, length = 100)
    private String lastName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private UserRole role;

    @Column(length = 150)
    private String department;

    @Column(length = 150)
    private String title;

    @Column(name = "avatar_url", columnDefinition = "TEXT")
    private String avatarUrl;

    @Column(length = 30)
    private String phone;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    // ─── SSO Fields ───────────────────────────────────────────

    @Column(name = "sso_provider", length = 50)
    private String ssoProvider;

    @Column(name = "sso_subject", length = 255)
    private String ssoSubject;

    // ─── Timestamps ───────────────────────────────────────────

    @Column(name = "last_login_at")
    private Instant lastLoginAt;

    @Column(name = "invited_at")
    private Instant invitedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Column(name = "deleted_at")
    private Instant deletedAt;

    // ─── Self-referential FKs ─────────────────────────────────

    /**
     * The user who sent the invitation for this account.
     * Lazy loaded — only accessed when explicitly needed.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invited_by")
    private User invitedBy;

    /**
     * The admin who deactivated this account (soft delete actor).
     * Lazy loaded.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "deleted_by")
    private User deletedBy;

    // ─── Lifecycle Callbacks ──────────────────────────────────

    @PrePersist
    protected void onCreate() {
        Instant now = Instant.now();
        if (this.createdAt == null) this.createdAt = now;
        if (this.updatedAt == null) this.updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
    }

    // ─── Convenience Methods ──────────────────────────────────

    public String getFullName() {
        return firstName + " " + lastName;
    }

    public boolean isSsoUser() {
        return ssoProvider != null;
    }

    public boolean isPasswordLoginEnabled() {
        return passwordHash != null;
    }
}
