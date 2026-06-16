package io.recruittrack.backend.security;

import io.recruittrack.backend.common.enums.UserRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

/**
 * Represents the authenticated user within Spring Security's SecurityContext.
 *
 * Populated directly from JWT claims — no database call per request.
 * A database call only occurs when the user's actual profile data is needed
 * (e.g., GET /auth/me).
 *
 * Spring Security convention: role authorities are prefixed with "ROLE_".
 * Example: UserRole.RECRUITER → GrantedAuthority("ROLE_RECRUITER")
 */
@Getter
@Builder
@AllArgsConstructor
public class UserPrincipal implements UserDetails {

    private final UUID id;
    private final String email;
    private final UserRole role;

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }

    @Override
    public String getPassword() {
        // Password is not stored in UserPrincipal.
        // It is only used during login via DaoAuthenticationProvider.
        return null;
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }
}
