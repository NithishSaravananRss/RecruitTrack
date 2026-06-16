package io.recruittrack.backend.users;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

/**
 * Spring Data JPA repository for the User entity.
 *
 * All queries automatically apply the @SQLRestriction("deleted_at IS NULL")
 * defined on the entity — soft-deleted users are invisible to all standard finders.
 *
 * Naming conventions:
 * - findBy* → returns Optional or List (standard Spring Data)
 * - existsBy* → returns boolean
 * - @Query → custom JPQL for non-standard operations
 */
@Repository
public interface UserRepository extends JpaRepository<User, UUID> {

    /**
     * Find a user by their email address (case-insensitive).
     * Used by CustomUserDetailsService during login.
     */
    Optional<User> findByEmailIgnoreCase(String email);

    /**
     * Check if an email is already registered.
     * Used when inviting a new team member to prevent duplicates.
     */
    boolean existsByEmailIgnoreCase(String email);

    /**
     * Soft delete a user by setting deleted_at.
     * Called by the admin deactivation endpoint (Phase 6).
     *
     * @Modifying is required for UPDATE/DELETE JPQL queries.
     * clearAutomatically = true invalidates the first-level cache after the update.
     */
    @Modifying(clearAutomatically = true)
    @Query("""
            UPDATE User u
            SET u.deletedAt = :now,
                u.deletedBy = :deletedBy,
                u.isActive   = false,
                u.updatedAt  = :now
            WHERE u.id = :userId
            """)
    void softDeleteById(@Param("userId") UUID userId,
                        @Param("deletedBy") User deletedBy,
                        @Param("now") Instant now);

    /**
     * Update last_login_at timestamp after a successful login.
     *
     * @Modifying with flush = true to ensure the update is immediately visible.
     */
    @Modifying(flushAutomatically = true)
    @Query("UPDATE User u SET u.lastLoginAt = :now WHERE u.id = :userId")
    void updateLastLoginAt(@Param("userId") UUID userId, @Param("now") Instant now);
}
