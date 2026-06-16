package io.recruittrack.backend.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.recruittrack.backend.common.dto.ApiResponse;
import io.recruittrack.backend.common.dto.ApiResponse.ErrorDetail;
import io.recruittrack.backend.common.exception.ErrorCode;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;

/**
 * Called by Spring Security when an unauthenticated request reaches a protected endpoint.
 *
 * Returns HTTP 401 with a JSON error response instead of Spring's default HTML 401 page.
 * This ensures the frontend always receives the ApiResponse envelope on auth failures.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthenticationEntryPoint implements AuthenticationEntryPoint {

    private final ObjectMapper objectMapper;

    @Override
    public void commence(
            HttpServletRequest request,
            HttpServletResponse response,
            AuthenticationException authException) throws IOException {

        log.warn("Unauthorized access attempt: {} {} — {}",
                request.getMethod(), request.getRequestURI(), authException.getMessage());

        ApiResponse<Void> body = ApiResponse.error(ErrorDetail.of(
                ErrorCode.UNAUTHORIZED.name(),
                "Authentication is required to access this resource"));

        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.getWriter().write(objectMapper.writeValueAsString(body));
    }
}
