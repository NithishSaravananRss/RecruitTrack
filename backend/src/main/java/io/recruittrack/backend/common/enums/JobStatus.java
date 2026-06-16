package io.recruittrack.backend.common.enums;

/**
 * Job status lifecycle.
 *
 * Valid transitions:
 * DRAFT   → ACTIVE, CLOSED
 * ACTIVE  → PAUSED, CLOSED
 * PAUSED  → ACTIVE, CLOSED
 * CLOSED  → ARCHIVED
 * ARCHIVED → (terminal — no further transitions)
 *
 * Stored as VARCHAR(30) in the jobs table.
 */
public enum JobStatus {

    DRAFT,
    ACTIVE,
    PAUSED,
    CLOSED,
    ARCHIVED;

    /**
     * Returns true if transitioning from this status to the target is permitted.
     * Used by JobServiceImpl.updateJobStatus() to enforce the state machine.
     */
    public boolean canTransitionTo(JobStatus target) {
        if (this == target) return false; // No-op transitions are invalid
        return switch (this) {
            case DRAFT    -> target == ACTIVE || target == CLOSED;
            case ACTIVE   -> target == PAUSED || target == CLOSED;
            case PAUSED   -> target == ACTIVE || target == CLOSED;
            case CLOSED   -> target == ARCHIVED;
            case ARCHIVED -> false;
        };
    }
}
