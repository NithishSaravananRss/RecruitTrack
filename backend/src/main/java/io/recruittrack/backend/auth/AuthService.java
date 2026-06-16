package io.recruittrack.backend.auth;

import io.recruittrack.backend.auth.dto.CurrentUserResponse;
import io.recruittrack.backend.auth.dto.LoginRequest;
import io.recruittrack.backend.auth.dto.LoginResponse;
import io.recruittrack.backend.common.dto.ApiResponse;
import io.recruittrack.backend.common.exception.BusinessRuleException;
import io.recruittrack.backend.common.exception.ErrorCode;
import io.recruittrack.backend.common.exception.ResourceNotFoundException;
import io.recruittrack.backend.config.AppProperties;
import io.recruittrack.backend.security.JwtTokenProvider;
import io.recruittrack.backend.security.TokenDenylistService;
import io.recruittrack.backend.security.UserPrincipal;
import io.recruittrack.backend.users.User;
import io.recruittrack.backend.users.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

/**
 * Authentication service — implements login, current user, and logout.
 *
 * Login flow:
 * 1. Delegate credential validation to AuthenticationManager (BCrypt via DaoAuthenticationProvider)
 * 2. Load full user entity from DB to check is_active flag and build token claims
 * 3. Generate JWT token with userId, email, role, jti
 * 4. Asynchronously update last_login_at (best-effort, not critical)
 * 5. Return LoginResponse with token + user summary
 *
 * Logout flow:
 * 1. Extract JTI from the request token
 * 2. Add JTI to denylist with token's original expiry
 * 3. All subsequent requests with this token are rejected by JwtAuthenticationFilter
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager  authenticationManager;
    private final JwtTokenProvider       jwtTokenProvider;
    private final TokenDenylistService   tokenDenylistService;
    private final UserRepository         userRepository;
    private final AppProperties          appProperties;

    // ─── Login ────────────────────────────────────────────────

    /**
     * Authenticate a user and return a JWT token.
     *
     * Intentionally throws generic errors for both "wrong password" and
     * "user not found" to prevent email enumeration attacks.
     */
    @Transactional
    public LoginResponse login(LoginRequest request) {
        // Step 1: Validate credentials via Spring Security
        Authentication authentication;
        try {
            authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getEmail().toLowerCase().trim(),
                            request.getPassword()));
        } catch (AuthenticationException ex) {
            log.warn("Login failed for email: {}", request.getEmail());
            throw new BusinessRuleException(ErrorCode.INVALID_CREDENTIALS,
                    "Invalid email or password");
        }

        // Step 2: Load full user entity (credentials are already verified above)
        User user = userRepository.findByEmailIgnoreCase(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("User", request.getEmail()));

        // Step 3: Verify account is active (is_active = true)
        if (Boolean.FALSE.equals(user.getIsActive())) {
            log.warn("Deactivated account login attempt: userId={}", user.getId());
            throw new BusinessRuleException(ErrorCode.ACCOUNT_DEACTIVATED,
                    "This account has been deactivated. Please contact your administrator.");
        }

        // Step 4: Generate JWT token
        String token = jwtTokenProvider.generateToken(user.getId(), user.getEmail(), user.getRole());

        // Step 5: Update last_login_at (best-effort)
        try {
            userRepository.updateLastLoginAt(user.getId(), Instant.now());
        } catch (Exception ex) {
            log.warn("Failed to update last_login_at for userId={}: {}", user.getId(), ex.getMessage());
        }

        log.info("Successful login: userId={}, role={}", user.getId(), user.getRole());

        return buildLoginResponse(token, user);
    }

    // ─── Current User ─────────────────────────────────────────

    /**
     * Return the full profile of the currently authenticated user.
     * Loads from DB to return the most current data (not just JWT claims).
     */
    @Transactional(readOnly = true)
    public CurrentUserResponse getCurrentUser(UserPrincipal principal) {
        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User", principal.getId()));

        return CurrentUserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .role(user.getRole())
                .department(user.getDepartment())
                .title(user.getTitle())
                .avatarUrl(user.getAvatarUrl())
                .phone(user.getPhone())
                .isActive(user.getIsActive())
                .lastLoginAt(user.getLastLoginAt())
                .createdAt(user.getCreatedAt())
                .build();
    }

    // ─── Logout ───────────────────────────────────────────────

    /**
     * Invalidate the provided JWT token by adding its JTI to the denylist.
     * The JwtAuthenticationFilter rejects all subsequent requests with this token.
     */
    public void logout(String bearerToken) {
        String token = extractRawToken(bearerToken);
        if (token == null) return;

        try {
            String jti    = jwtTokenProvider.extractJti(token);
            Instant expiry = jwtTokenProvider.extractExpiry(token).toInstant();
            tokenDenylistService.addToDenylist(jti, expiry);
            log.info("Token invalidated (logout): jti={}", jti);
        } catch (Exception ex) {
            // Token may already be expired — logout is still successful
            log.debug("Could not parse token during logout (may be expired): {}", ex.getMessage());
        }
    }

    // ─── Internal Helpers ─────────────────────────────────────

    private LoginResponse buildLoginResponse(String token, User user) {
        long expiresInSeconds = appProperties.getJwt().getExpirationMs() / 1000;

        return LoginResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .expiresIn(expiresInSeconds)
                .user(LoginResponse.UserSummary.builder()
                        .id(user.getId())
                        .email(user.getEmail())
                        .firstName(user.getFirstName())
                        .lastName(user.getLastName())
                        .role(user.getRole())
                        .avatarUrl(user.getAvatarUrl())
                        .department(user.getDepartment())
                        .title(user.getTitle())
                        .build())
                .build();
    }

    private String extractRawToken(String bearerToken) {
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}
