package io.recruittrack.backend.candidates;

import io.recruittrack.backend.security.UserPrincipal;
import io.recruittrack.backend.users.User;
import io.recruittrack.backend.users.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class CandidateTimelineEventServiceImpl implements CandidateTimelineEventService {

    private final CandidateTimelineEventRepository timelineRepository;
    private final CandidateRepository candidateRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional(propagation = Propagation.MANDATORY)
    public void logEvent(UUID candidateId, String eventType, String title, String description, UserPrincipal principal) {
        Candidate candidate = candidateRepository.getReferenceById(candidateId);
        
        User user = null;
        if (principal != null) {
            user = userRepository.getReferenceById(principal.getId());
        }

        CandidateTimelineEvent event = CandidateTimelineEvent.builder()
                .candidate(candidate)
                .eventType(eventType)
                .title(title)
                .description(description)
                .createdBy(user)
                .createdAt(Instant.now())
                .build();

        timelineRepository.save(event);
        log.debug("Candidate Timeline Event saved: {} for candidate {}", eventType, candidateId);
    }
}
