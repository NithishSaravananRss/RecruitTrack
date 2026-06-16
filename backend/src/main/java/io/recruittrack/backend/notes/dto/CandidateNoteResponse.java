package io.recruittrack.backend.notes.dto;

import io.recruittrack.backend.common.dto.UserSummaryDto;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class CandidateNoteResponse {
    private UUID id;
    private UUID candidateId;
    private String content;
    private Boolean isPrivate;
    private UserSummaryDto createdBy;
    private Instant createdAt;
    private Instant updatedAt;
}
