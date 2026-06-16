package io.recruittrack.backend.auth;

import io.recruittrack.backend.common.enums.UserRole;
import io.recruittrack.backend.config.AppProperties;
import io.recruittrack.backend.users.User;
import io.recruittrack.backend.users.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
@Order(1)
public class AdminBootstrapRunner implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AppProperties appProperties;

    @Override
    public void run(String... args) {
        if (userRepository.count() > 0) {
            log.info("Database is not empty. Skipping admin bootstrap.");
            return;
        }

        String email = appProperties.getBootstrap().getAdminEmail();
        String password = appProperties.getBootstrap().getAdminPassword();

        if (email == null || email.isBlank() || password == null || password.isBlank()) {
            log.info("Bootstrap credentials not fully provided. Skipping admin bootstrap.");
            return;
        }

        log.info("Database is empty and bootstrap credentials provided. Creating initial users.");

        User admin = User.builder()
                .email(email)
                .passwordHash(passwordEncoder.encode(password))
                .firstName(appProperties.getBootstrap().getAdminFirstName() != null ? appProperties.getBootstrap().getAdminFirstName() : "System")
                .lastName(appProperties.getBootstrap().getAdminLastName() != null ? appProperties.getBootstrap().getAdminLastName() : "Admin")
                .role(UserRole.ADMIN)
                .isActive(true)
                .build();
        userRepository.save(admin);

        User recruiter = User.builder()
                .email("recruiter@recruittrack.io")
                .passwordHash(passwordEncoder.encode("Demo@123"))
                .firstName("Jane")
                .lastName("Recruiter")
                .role(UserRole.RECRUITER)
                .isActive(true)
                .build();
        userRepository.save(recruiter);

        User manager = User.builder()
                .email("manager@recruittrack.io")
                .passwordHash(passwordEncoder.encode("Demo@123"))
                .firstName("John")
                .lastName("Manager")
                .role(UserRole.HIRING_MANAGER)
                .isActive(true)
                .build();
        userRepository.save(manager);

        log.info("Successfully created initial ADMIN, RECRUITER, and HIRING_MANAGER users.");
    }
}
