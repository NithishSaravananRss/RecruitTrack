package io.recruittrack.backend.common.exception;

import io.recruittrack.backend.common.dto.ApiResponse;
import io.recruittrack.backend.common.dto.ApiResponse.ErrorDetail;
import io.recruittrack.backend.common.dto.ApiResponse.ErrorDetail.FieldViolation;
import jakarta.validation.ConstraintViolationException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.List;

/**
 * Centralized exception handler for all controllers.
 * Every error response follows the ApiResponse envelope contract
 * defined in the Phase 3 API Design document.
 *
 * Critical rule: The catch-all Exception handler NEVER exposes
 * internal details — only a generic message is returned.
 * The full stack trace is logged internally.
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    // ─── 400 — Validation: @Valid on request body ─────────────

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Void>> handleValidation(MethodArgumentNotValidException ex) {
        List<FieldViolation> violations = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(this::toFieldViolation)
                .toList();

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(ErrorDetail.validationError(violations)));
    }

    // ─── 400 — Validation: @Validated on path/query params ────

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ApiResponse<Void>> handleConstraintViolation(ConstraintViolationException ex) {
        List<FieldViolation> violations = ex.getConstraintViolations()
                .stream()
                .map(v -> FieldViolation.builder()
                        .field(extractFieldName(v.getPropertyPath().toString()))
                        .message(v.getMessage())
                        .build())
                .toList();

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(ErrorDetail.validationError(violations)));
    }

    // ─── 400 — Malformed JSON body ────────────────────────────

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiResponse<Void>> handleMalformedJson(HttpMessageNotReadableException ex) {
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(ErrorDetail.of(
                        ErrorCode.VALIDATION_FAILED.name(),
                        "Request body is malformed or missing")));
    }

    // ─── 403 — Forbidden (Spring Security AccessDeniedException)

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiResponse<Void>> handleAccessDenied(AccessDeniedException ex) {
        return ResponseEntity
                .status(HttpStatus.FORBIDDEN)
                .body(ApiResponse.error(ErrorDetail.of(
                        ErrorCode.FORBIDDEN.name(),
                        "You do not have permission to perform this action")));
    }

    // ─── 403 — Custom ForbiddenException ─────────────────────

    @ExceptionHandler(ForbiddenException.class)
    public ResponseEntity<ApiResponse<Void>> handleForbidden(ForbiddenException ex) {
        return ResponseEntity
                .status(HttpStatus.FORBIDDEN)
                .body(ApiResponse.error(ErrorDetail.of(
                        ErrorCode.FORBIDDEN.name(),
                        ex.getMessage())));
    }

    // ─── 401 — Authentication (Spring Security) ───────────────

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ApiResponse<Void>> handleAuthentication(AuthenticationException ex) {
        return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.error(ErrorDetail.of(
                        ErrorCode.UNAUTHORIZED.name(),
                        "Authentication is required to access this resource")));
    }

    // ─── 404 — Resource Not Found ─────────────────────────────

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleNotFound(ResourceNotFoundException ex) {
        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error(ErrorDetail.of(
                        ex.getErrorCode().name(),
                        ex.getMessage())));
    }

    // ─── 409 — Duplicate Resource ─────────────────────────────

    @ExceptionHandler(DuplicateResourceException.class)
    public ResponseEntity<ApiResponse<Void>> handleDuplicate(DuplicateResourceException ex) {
        return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(ApiResponse.error(ErrorDetail.of(
                        ex.getErrorCode().name(),
                        ex.getMessage())));
    }

    // ─── 409 — Business Rule Violation ────────────────────────

    @ExceptionHandler(BusinessRuleException.class)
    public ResponseEntity<ApiResponse<Void>> handleBusinessRule(BusinessRuleException ex) {
        return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(ApiResponse.error(ErrorDetail.of(
                        ex.getErrorCode().name(),
                        ex.getMessage())));
    }

    // ─── 405 — Method Not Allowed ────────────────────────────

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ApiResponse<Void>> handleMethodNotAllowed(HttpRequestMethodNotSupportedException ex) {
        return ResponseEntity
                .status(HttpStatus.METHOD_NOT_ALLOWED)
                .body(ApiResponse.error(ErrorDetail.of(
                        ErrorCode.METHOD_NOT_ALLOWED.name(),
                        String.format("HTTP method '%s' is not supported for this endpoint", ex.getMethod()))));
    }

    // ─── 500 — Catch-All (NEVER expose internals) ─────────────

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleGeneric(Exception ex) {
        // Log full stack trace internally — never return it in the response
        log.error("Unhandled exception: {}", ex.getMessage(), ex);

        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error(ErrorDetail.of(
                        ErrorCode.INTERNAL_SERVER_ERROR.name(),
                        "An unexpected error occurred. Please try again later.")));
    }

    // ─── Helpers ──────────────────────────────────────────────

    private FieldViolation toFieldViolation(FieldError fieldError) {
        return FieldViolation.builder()
                .field(fieldError.getField())
                .message(fieldError.getDefaultMessage())
                .build();
    }

    private String extractFieldName(String propertyPath) {
        // "methodName.fieldName" → "fieldName"
        int lastDot = propertyPath.lastIndexOf('.');
        return lastDot >= 0 ? propertyPath.substring(lastDot + 1) : propertyPath;
    }
}
