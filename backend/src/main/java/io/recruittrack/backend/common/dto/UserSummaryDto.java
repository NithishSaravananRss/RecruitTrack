package io.recruittrack.backend.common.dto;

import io.recruittrack.backend.common.enums.UserRole;
import lombok.Builder;
import lombok.Data;

import java.util.UUID;

/**
 * Compact user representation embedded inside resource responses.
 * Used wherever a FK relationship to users needs to be surfaced in the API.
 *
 * Examples:
 * - JobResponse.hiringManager
 * - JobResponse.createdBy
 * - InterviewResponse.interviewers (Phase 8)
 *
 * NEVER includes password_hash or deleted_at.
 */
@Data
@Builder
public class UserSummaryDto {
    private UUID     id;
    private String   firstName;
    private String   lastName;
    private String   email;
    private String   avatarUrl;
    private UserRole role;

    /** Convenience method for display purposes. */
    public String getFullName() {
        return firstName + " " + lastName;
    }
}
