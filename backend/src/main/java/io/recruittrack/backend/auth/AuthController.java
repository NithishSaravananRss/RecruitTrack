package io.recruittrack.backend.auth;

import io.recruittrack.backend.auth.dto.CurrentUserResponse;
import io.recruittrack.backend.auth.dto.LoginRequest;
import io.recruittrack.backend.auth.dto.LoginResponse;
import io.recruittrack.backend.common.dto.ApiResponse;
import io.recruittrack.backend.security.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/**
 * Authentication REST controller.
 *
 * Endpoints:
 * - POST /api/v1/auth/login      — Public. Authenticate and receive a JWT token.
 * - GET  /api/v1/auth/me         — Protected. Return the current user's profile.
 * - POST /api/v1/auth/logout     — Protected. Invalidate the current JWT token.
 *
 * All endpoints return the ApiResponse envelope.
 * See Phase 3 API Design document for full request/response contracts.
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    // ─── POST /api/v1/auth/login ──────────────────────────────

    /**
     * Authenticate with email and password.
     * Returns a JWT Bearer token on success.
     *
     * HTTP 200: Login successful, token in response body
     * HTTP 400: Validation failed (missing/invalid fields)
     * HTTP 401: Invalid credentials
     * HTTP 403: Account deactivated
     */
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(
            @Valid @RequestBody LoginRequest request) {

        LoginResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    // ─── GET /api/v1/auth/me ──────────────────────────────────

    /**
     * Return the profile of the currently authenticated user.
     * Requires a valid JWT in the Authorization header.
     *
     * HTTP 200: User profile returned
     * HTTP 401: Missing or invalid token
     */
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<CurrentUserResponse>> getCurrentUser(
            @AuthenticationPrincipal UserPrincipal principal) {

        CurrentUserResponse response = authService.getCurrentUser(principal);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    // ─── POST /api/v1/auth/logout ─────────────────────────────

    /**
     * Invalidate the current JWT token.
     * The token is added to an in-memory denylist for the remainder of its lifetime.
     * All subsequent requests using this token will receive HTTP 401.
     *
     * The Authorization header must contain the token being invalidated.
     *
     * HTTP 200: Logout successful (token denylisted)
     * HTTP 401: Missing or already-invalid token
     */
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader) {

        authService.logout(authorizationHeader);
        return ResponseEntity.ok(ApiResponse.success(null, "Logged out successfully"));
    }
}
