package io.recruittrack.backend.security;

import io.recruittrack.backend.common.enums.UserRole;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

/**
 * JWT Authentication Filter — runs once per HTTP request.
 *
 * Execution flow:
 * 1. Extract "Authorization: Bearer <token>" header
 * 2. Validate token signature, expiry, and issuer via JwtTokenProvider
 * 3. Check token is not denylisted (i.e., user hasn't logged out)
 * 4. Build UserPrincipal from token claims (no DB call)
 * 5. Set UsernamePasswordAuthenticationToken in SecurityContextHolder
 * 6. Inject correlation ID and user info into MDC for structured logging
 * 7. Clear MDC after response is sent
 *
 * If any step fails, the SecurityContext remains unauthenticated
 * and the request will be rejected by the security filter chain.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final String BEARER_PREFIX     = "Bearer ";
    private static final String AUTHORIZATION     = "Authorization";
    private static final String CORRELATION_HEADER = "X-Correlation-ID";

    private final JwtTokenProvider    jwtTokenProvider;
    private final TokenDenylistService tokenDenylistService;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {

        // ── 1. Inject correlation ID into MDC ──────────────────
        String correlationId = resolveCorrelationId(request);
        MDC.put("correlationId", correlationId);
        response.setHeader(CORRELATION_HEADER, correlationId);

        try {
            // ── 2. Extract token ────────────────────────────────
            String token = extractBearerToken(request);

            if (StringUtils.hasText(token)
                    && SecurityContextHolder.getContext().getAuthentication() == null) {

                authenticateRequest(token, request);
            }

            filterChain.doFilter(request, response);

        } finally {
            // ── Always clear MDC to prevent leaking across threads ──
            MDC.clear();
        }
    }

    private void authenticateRequest(String token, HttpServletRequest request) {
        // ── 3. Validate token ───────────────────────────────────
        if (!jwtTokenProvider.isTokenValid(token)) {
            log.debug("JWT validation failed for request: {} {}", request.getMethod(), request.getRequestURI());
            return;
        }

        // ── 4. Check denylist (logout) ──────────────────────────
        String jti = jwtTokenProvider.extractJti(token);
        if (tokenDenylistService.isDenylisted(jti)) {
            log.debug("Denylisted token attempted: jti={}", jti);
            return;
        }

        // ── 5. Build UserPrincipal from claims (no DB call) ─────
        UUID     userId = jwtTokenProvider.extractUserId(token);
        String   email  = jwtTokenProvider.extractEmail(token);
        UserRole role   = jwtTokenProvider.extractRole(token);

        UserPrincipal principal = UserPrincipal.builder()
                .id(userId)
                .email(email)
                .role(role)
                .build();

        // ── 6. Inject into MDC for this request's log lines ─────
        MDC.put("userId", userId.toString());
        MDC.put("userRole", role.name());

        // ── 7. Set authentication in SecurityContext ────────────
        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
        authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
        SecurityContextHolder.getContext().setAuthentication(authentication);

        log.debug("Authenticated user: userId={}, role={}, endpoint={} {}",
                userId, role, request.getMethod(), request.getRequestURI());
    }

    // ─── Helpers ──────────────────────────────────────────────

    private String extractBearerToken(HttpServletRequest request) {
        String header = request.getHeader(AUTHORIZATION);
        if (StringUtils.hasText(header) && header.startsWith(BEARER_PREFIX)) {
            return header.substring(BEARER_PREFIX.length());
        }
        return null;
    }

    private String resolveCorrelationId(HttpServletRequest request) {
        String clientProvided = request.getHeader(CORRELATION_HEADER);
        return StringUtils.hasText(clientProvided)
                ? clientProvided
                : "req-" + UUID.randomUUID().toString().substring(0, 8);
    }
}
