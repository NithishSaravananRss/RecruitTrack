package io.recruittrack.backend;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

/**
 * Spring application context load test.
 *
 * Verifies that all beans wire correctly with a test configuration.
 * Uses @TestPropertySource to supply required environment variables
 * without needing a real database or .env file.
 *
 * Run with: mvn test
 */
@SpringBootTest
@ActiveProfiles("dev")
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:testdb;DB_CLOSE_DELAY=-1",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.H2Dialect",
        "app.jwt.secret=dGVzdFNlY3JldEtleUZvclVuaXRUZXN0aW5nT25seU5vdEZvclByb2R1Y3Rpb24xMjM0NTY3ODk=",
        "app.jwt.issuer=recruittrack.io",
        "DATABASE_USERNAME=sa",
        "DATABASE_PASSWORD="
})
class RecruitTrackApplicationTests {

    @Test
    void contextLoads() {
        // If this test passes, all Spring beans wired correctly
    }
}
