package io.recruittrack.backend.security;

import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;

/**
 * In-memory JWT token denylist for logout support.
 *
 * When a user logs out, their token's JTI (JWT ID) is added to this denylist
 * with the token's original expiry time. The JwtAuthenticationFilter checks
 * this denylist on every request.
 *
 * Implementation: ConcurrentHashMap<jti, expiryInstant>
 * - Thread-safe for concurrent access
 * - Entries are self-expiring — a scheduled cleanup runs hourly
 *
 * Production note: Replace with Redis before horizontal scaling.
 * Redis key: "denylist:{jti}" with TTL set to remaining token lifetime.
 */
@Slf4j
@Service
public class TokenDenylistService {

    private final ConcurrentHashMap<String, Instant> denylist = new ConcurrentHashMap<>();

    /**
     * Add a token to the denylist.
     *
     * @param jti    the JWT ID claim from the token
     * @param expiry the token's expiry time (used to auto-expire the denylist entry)
     */
    public void addToDenylist(String jti, Instant expiry) {
        denylist.put(jti, expiry);
        log.debug("Token {} added to denylist. Denylist size: {}", jti, denylist.size());
    }

    /**
     * Check whether a token JTI is in the denylist.
     * Expired denylist entries are treated as not denylisted (they're auto-cleaned).
     *
     * @param jti the JWT ID claim to check
     * @return true if the token has been explicitly revoked via logout
     */
    public boolean isDenylisted(String jti) {
        Instant expiry = denylist.get(jti);
        if (expiry == null) return false;
        if (Instant.now().isAfter(expiry)) {
            // Token was already expired anyway — remove and return false
            denylist.remove(jti);
            return false;
        }
        return true;
    }

    /**
     * Scheduled cleanup: remove entries whose token expiry has already passed.
     * Runs every hour. Prevents unbounded memory growth in high-logout scenarios.
     */
    @Scheduled(fixedDelay = 3_600_000L)
    public void evictExpiredEntries() {
        Instant now = Instant.now();
        int before = denylist.size();
        denylist.entrySet().removeIf(entry -> now.isAfter(entry.getValue()));
        int removed = before - denylist.size();
        if (removed > 0) {
            log.debug("Token denylist cleanup: removed {} expired entries. Remaining: {}",
                    removed, denylist.size());
        }
    }
}
