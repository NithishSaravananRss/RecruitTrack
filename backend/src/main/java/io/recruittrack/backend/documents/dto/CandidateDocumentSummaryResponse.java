package io.recruittrack.backend.documents.dto;

import io.recruittrack.backend.common.enums.DocumentType;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class CandidateDocumentSummaryResponse {
    private UUID id;
    private String fileName;
    private String mimeType;
    private Long fileSizeBytes;
    private DocumentType documentType;
    private Boolean isLatestResume;
    private Instant createdAt;
}
