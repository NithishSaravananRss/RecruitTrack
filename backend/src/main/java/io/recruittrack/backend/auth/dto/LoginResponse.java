package io.recruittrack.backend.auth.dto;

import io.recruittrack.backend.common.enums.UserRole;
import lombok.Builder;
import lombok.Data;

import java.util.UUID;

/**
 * Response body for POST /api/v1/auth/login
 *
 * Matches Phase 3 API contract:
 * {
 *   "success": true,
 *   "data": {
 *     "token":     "eyJhbGciOiJIUzI1NiJ9...",
 *     "tokenType": "Bearer",
 *     "expiresIn": 86400,
 *     "user": {
 *       "id":        "uuid",
 *       "email":     "jane@recruittrack.io",
 *       "firstName": "Jane",
 *       "lastName":  "Doe",
 *       "role":      "RECRUITER",
 *       "avatarUrl": null
 *     }
 *   }
 * }
 */
@Data
@Builder
public class LoginResponse {

    private String    token;
    private String    tokenType;
    private long      expiresIn;   // seconds
    private UserSummary user;

    @Data
    @Builder
    public static class UserSummary {
        private UUID     id;
        private String   email;
        private String   firstName;
        private String   lastName;
        private UserRole role;
        private String   avatarUrl;
        private String   department;
        private String   title;
    }
}
