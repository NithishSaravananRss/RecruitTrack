package io.recruittrack.backend.security;

import io.recruittrack.backend.common.enums.UserRole;
import io.recruittrack.backend.config.AppProperties;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.io.Decoders;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.UUID;

/**
 * JWT token lifecycle manager.
 *
 * Responsibilities:
 * - Generate signed JWT tokens on login
 * - Validate token signature, expiry, and issuer
 * - Extract claims (userId, email, role, jti) from valid tokens
 *
 * Uses JJWT 0.12.x API (verifyWith / parseSignedClaims).
 * Algorithm: HMAC-SHA256 (HS256).
 * Secret: Base64-encoded key loaded from JWT_SECRET environment variable.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class JwtTokenProvider {

    private final AppProperties appProperties;

    // ─── Token Generation ─────────────────────────────────────

    /**
     * Generate a signed JWT token for an authenticated user.
     *
     * Token claims:
     * - sub  → userId (UUID as string)
     * - email → user's email address
     * - role  → UserRole enum name (ADMIN, RECRUITER, HIRING_MANAGER)
     * - iss   → configured issuer
     * - jti   → unique token ID (used for denylist on logout)
     * - iat   → issued at timestamp
     * - exp   → expiry timestamp
     */
    public String generateToken(UUID userId, String email, UserRole role) {
        Date now    = new Date();
        Date expiry = new Date(now.getTime() + appProperties.getJwt().getExpirationMs());

        return Jwts.builder()
                .id(UUID.randomUUID().toString())               // jti — unique per token
                .subject(userId.toString())                     // sub — user UUID
                .claim("email", email)
                .claim("role", role.name())
                .issuer(appProperties.getJwt().getIssuer())
                .issuedAt(now)
                .expiration(expiry)
                .signWith(getSigningKey())
                .compact();
    }

    // ─── Token Validation ─────────────────────────────────────

    /**
     * Returns true if the token signature is valid, not expired,
     * and the issuer matches the configured issuer.
     * Does NOT check the denylist — that is done in JwtAuthenticationFilter.
     */
    public boolean isTokenValid(String token) {
        try {
            parseClaims(token);
            return true;
        } catch (ExpiredJwtException ex) {
            log.warn("JWT token is expired: {}", ex.getMessage());
        } catch (JwtException ex) {
            log.warn("JWT token is invalid: {}", ex.getMessage());
        } catch (Exception ex) {
            log.warn("JWT token validation failed: {}", ex.getMessage());
        }
        return false;
    }

    // ─── Claims Extraction ────────────────────────────────────

    public UUID extractUserId(String token) {
        return UUID.fromString(parseClaims(token).getSubject());
    }

    public String extractEmail(String token) {
        return parseClaims(token).get("email", String.class);
    }

    public UserRole extractRole(String token) {
        String roleName = parseClaims(token).get("role", String.class);
        return UserRole.valueOf(roleName);
    }

    /**
     * Returns the JWT ID (jti claim) used to identify this specific token.
     * Required for the logout denylist.
     */
    public String extractJti(String token) {
        return parseClaims(token).getId();
    }

    /**
     * Returns the token expiry time as a java.util.Date.
     * Used to set the denylist entry expiry on logout.
     */
    public Date extractExpiry(String token) {
        return parseClaims(token).getExpiration();
    }

    // ─── Internal Helpers ─────────────────────────────────────

    private Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .requireIssuer(appProperties.getJwt().getIssuer())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private SecretKey getSigningKey() {
        byte[] keyBytes = Decoders.BASE64.decode(appProperties.getJwt().getSecret());
        return Keys.hmacShaKeyFor(keyBytes);
    }
}
