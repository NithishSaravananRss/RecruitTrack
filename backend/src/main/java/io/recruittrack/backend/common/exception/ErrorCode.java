package io.recruittrack.backend.common.exception;

/**
 * All application-level error codes.
 * Maps to the ErrorCode enum defined in Phase 4 Backend Foundation.
 *
 * Naming convention: SCREAMING_SNAKE_CASE, grouped by category.
 */
public enum ErrorCode {

    // ─── Authentication ────────────────────────────────────────
    UNAUTHORIZED,
    INVALID_CREDENTIALS,
    ACCOUNT_DEACTIVATED,
    TOKEN_EXPIRED,
    TOKEN_INVALID,
    TOKEN_MISSING,

    // ─── Authorization ─────────────────────────────────────────
    FORBIDDEN,

    // ─── Resource Errors ──────────────────────────────────────
    RESOURCE_NOT_FOUND,

    // ─── Conflict / Business Rules ────────────────────────────
    EMAIL_ALREADY_EXISTS,
    DUPLICATE_APPLICATION,
    JOB_HAS_ACTIVE_APPLICATIONS,
    JOB_NOT_ACTIVE,
    INVALID_STATUS_TRANSITION,
    FEEDBACK_ALREADY_SUBMITTED,
    LAST_ADMIN_DEACTIVATION,
    SELF_DEACTIVATION,
    SELF_ROLE_CHANGE,
    APPLICATION_NOT_ACTIVE,
    BUSINESS_RULE_VIOLATION,

    // ─── Validation ───────────────────────────────────────────
    VALIDATION_FAILED,

    // ─── System ───────────────────────────────────────────────
    INTERNAL_SERVER_ERROR,
    METHOD_NOT_ALLOWED,
    FILE_TOO_LARGE
}
