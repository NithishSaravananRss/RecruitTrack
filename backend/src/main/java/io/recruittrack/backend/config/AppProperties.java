package io.recruittrack.backend.config;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

import java.util.List;

/**
 * Strongly typed application configuration.
 * All values are read from application.yml which reads from environment variables.
 *
 * @Validated ensures the application fails fast at startup if any required
 * property is missing or invalid.
 */
@Data
@Validated
@ConfigurationProperties(prefix = "app")
public class AppProperties {

    @Valid
    @NotNull
    private Jwt jwt = new Jwt();

    @Valid
    @NotNull
    private Cors cors = new Cors();

    @Valid
    @NotNull
    private Bootstrap bootstrap = new Bootstrap();

    @Data
    public static class Jwt {

        /**
         * Base64-encoded HMAC-SHA256 secret key.
         * Minimum 256 bits (32 bytes). Generate with:
         * openssl rand -base64 64
         */
        @NotBlank(message = "JWT_SECRET environment variable must be set")
        private String secret;

        /**
         * Token validity in milliseconds. Default: 86400000 (24 hours).
         */
        private long expirationMs = 86_400_000L;

        /**
         * Token issuer claim value.
         */
        @NotBlank(message = "JWT_ISSUER must be set")
        private String issuer = "recruittrack.io";
    }

    @Data
    public static class Cors {

        /**
         * Comma-separated list of allowed CORS origins.
         * Example: http://localhost:5173,https://app.recruittrack.io
         */
        private List<String> allowedOrigins = List.of("http://localhost:5173");
    }

    @Data
    public static class Bootstrap {
        private String adminEmail = "";
        private String adminPassword = "";
        private String adminFirstName = "System";
        private String adminLastName = "Admin";
    }
}
