package io.recruittrack.backend.candidates;

import io.recruittrack.backend.security.UserPrincipal;
import java.util.UUID;

public interface CandidateTimelineEventService {
    void logEvent(UUID candidateId, String eventType, String title, String description, UserPrincipal principal);
}
