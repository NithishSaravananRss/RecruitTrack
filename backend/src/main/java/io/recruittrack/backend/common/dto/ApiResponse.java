package io.recruittrack.backend.common.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Universal response envelope for all API responses.
 * Matches the contract defined in Phase 3 API Design document.
 *
 * Success:  { "success": true,  "data": {...}, "message": "..." }
 * Error:    { "success": false, "error": {...} }
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {

    private boolean success;
    private T data;
    private String message;
    private ErrorDetail error;

    // ─── Factory methods ──────────────────────────────────────

    public static <T> ApiResponse<T> success(T data) {
        return ApiResponse.<T>builder()
                .success(true)
                .data(data)
                .build();
    }

    public static <T> ApiResponse<T> success(T data, String message) {
        return ApiResponse.<T>builder()
                .success(true)
                .data(data)
                .message(message)
                .build();
    }

    public static <T> ApiResponse<T> error(ErrorDetail error) {
        return ApiResponse.<T>builder()
                .success(false)
                .error(error)
                .build();
    }

    // ─── Error Detail ─────────────────────────────────────────

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class ErrorDetail {
        private String code;
        private String message;
        private String field;
        private List<FieldViolation> violations;

        /** Convenience factory for simple errors */
        public static ErrorDetail of(String code, String message) {
            return ErrorDetail.builder().code(code).message(message).build();
        }

        /** Convenience factory for field-level validation errors */
        public static ErrorDetail validationError(List<FieldViolation> violations) {
            return ErrorDetail.builder()
                    .code("VALIDATION_FAILED")
                    .message("Request validation failed")
                    .violations(violations)
                    .build();
        }

        @Data
        @Builder
        @NoArgsConstructor
        @AllArgsConstructor
        public static class FieldViolation {
            private String field;
            private String message;
        }
    }
}
