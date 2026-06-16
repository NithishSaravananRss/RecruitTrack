package io.recruittrack.backend.common.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Thrown when a requested resource does not exist or is not accessible
 * to the current user. Always maps to HTTP 404.
 *
 * Note: We intentionally return 404 (not 403) when a user requests a
 * resource outside their data scope. This prevents information leakage
 * about the existence of resources the caller cannot access.
 */
@ResponseStatus(HttpStatus.NOT_FOUND)
public class ResourceNotFoundException extends RuntimeException {

    private final ErrorCode errorCode;

    public ResourceNotFoundException(String resourceName, Object id) {
        super(String.format("%s with id '%s' not found", resourceName, id));
        this.errorCode = ErrorCode.RESOURCE_NOT_FOUND;
    }

    public ResourceNotFoundException(String message) {
        super(message);
        this.errorCode = ErrorCode.RESOURCE_NOT_FOUND;
    }

    public ErrorCode getErrorCode() {
        return errorCode;
    }
}
