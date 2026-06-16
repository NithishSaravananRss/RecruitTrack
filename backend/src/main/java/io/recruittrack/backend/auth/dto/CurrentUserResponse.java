package io.recruittrack.backend.auth.dto;

import io.recruittrack.backend.common.enums.UserRole;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

/**
 * Response body for GET /api/v1/auth/me
 *
 * Returns the full profile of the currently authenticated user.
 * Sensitive fields (password_hash, deleted_at) are never included.
 *
 * Matches Phase 3 API contract:
 * {
 *   "success": true,
 *   "data": {
 *     "id":          "uuid",
 *     "email":       "jane@recruittrack.io",
 *     "firstName":   "Jane",
 *     "lastName":    "Doe",
 *     "role":        "RECRUITER",
 *     "department":  "Engineering",
 *     "title":       "Technical Recruiter",
 *     "avatarUrl":   null,
 *     "phone":       null,
 *     "isActive":    true,
 *     "lastLoginAt": "2026-06-05T08:00:00Z",
 *     "createdAt":   "2026-01-15T12:00:00Z"
 *   }
 * }
 */
@Data
@Builder
public class CurrentUserResponse {

    private UUID      id;
    private String    email;
    private String    firstName;
    private String    lastName;
    private UserRole  role;
    private String    department;
    private String    title;
    private String    avatarUrl;
    private String    phone;
    private Boolean   isActive;
    private Instant   lastLoginAt;
    private Instant   createdAt;
}
