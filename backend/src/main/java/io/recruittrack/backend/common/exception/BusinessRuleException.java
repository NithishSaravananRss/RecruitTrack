package io.recruittrack.backend.common.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Thrown when a valid request violates a business rule
 * (e.g., moving an application backward in the pipeline,
 * rejecting an already-rejected application, closing a job
 * that has active applications).
 * Maps to HTTP 409.
 */
@ResponseStatus(HttpStatus.CONFLICT)
public class BusinessRuleException extends RuntimeException {

    private final ErrorCode errorCode;

    public BusinessRuleException(ErrorCode errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
    }

    public BusinessRuleException(String message) {
        super(message);
        this.errorCode = ErrorCode.BUSINESS_RULE_VIOLATION;
    }

    public ErrorCode getErrorCode() {
        return errorCode;
    }
}
