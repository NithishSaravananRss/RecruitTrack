package io.recruittrack.backend.common.enums;

/**
 * System roles as defined in the Phase 2 approved schema.
 * Stored as VARCHAR(30) in the users table.
 */
public enum UserRole {
    ADMIN,
    RECRUITER,
    HIRING_MANAGER
}
