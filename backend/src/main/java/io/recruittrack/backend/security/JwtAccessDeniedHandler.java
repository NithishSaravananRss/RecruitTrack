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
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

/**
 * Called by Spring Security when an authenticated user attempts to access
 * a resource they do not have permission for.
 *
 * Returns HTTP 403 with a JSON error response instead of Spring's default HTML 403 page.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAccessDeniedHandler implements AccessDeniedHandler {

    private final ObjectMapper objectMapper;

    @Override
    public void handle(
            HttpServletRequest request,
            HttpServletResponse response,
            AccessDeniedException accessDeniedException) throws IOException {

        log.warn("Access denied: {} {} — {}",
                request.getMethod(), request.getRequestURI(), accessDeniedException.getMessage());

        ApiResponse<Void> body = ApiResponse.error(ErrorDetail.of(
                ErrorCode.FORBIDDEN.name(),
                "You do not have permission to perform this action"));

        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.getWriter().write(objectMapper.writeValueAsString(body));
    }
}
