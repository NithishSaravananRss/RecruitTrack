package io.recruittrack.backend.health;

import io.recruittrack.backend.common.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.sql.Connection;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Application health check endpoint.
 *
 * GET /api/v1/health — Public (no authentication required)
 *
 * Checks:
 * - Application is running (always true if this code executes)
 * - Database connectivity (SELECT 1 via DataSource ping)
 *
 * Returns:
 * - HTTP 200 with "status": "UP"   when all checks pass
 * - HTTP 503 with "status": "DOWN" when DB is unreachable
 *
 * Used by: load balancers, Kubernetes readiness/liveness probes, monitoring systems.
 *
 * Security: Permitted without authentication in SecurityConfig.PUBLIC_ENDPOINTS.
 * Database credentials and internal details are NEVER included in the response.
 */
@Slf4j
@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class HealthController {

    private final DataSource dataSource;

    @GetMapping("/health")
    public ResponseEntity<ApiResponse<Map<String, Object>>> health() {
        boolean dbHealthy = checkDatabaseConnectivity();

        Map<String, Object> healthData = new LinkedHashMap<>();
        healthData.put("status",      dbHealthy ? "UP" : "DOWN");
        healthData.put("version",     "1.0.0");
        healthData.put("timestamp",   Instant.now().toString());

        if (dbHealthy) {
            return ResponseEntity.ok(ApiResponse.success(healthData));
        } else {
            // Return 503 — load balancers look for non-2xx to stop routing traffic
            return ResponseEntity
                    .status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(ApiResponse.<Map<String, Object>>builder()
                            .success(false)
                            .data(healthData)
                            .build());
        }
    }

    private boolean checkDatabaseConnectivity() {
        try (Connection connection = dataSource.getConnection()) {
            return connection.isValid(2); // 2-second timeout
        } catch (Exception ex) {
            log.error("Database health check failed: {}", ex.getMessage());
            return false;
        }
    }
}
