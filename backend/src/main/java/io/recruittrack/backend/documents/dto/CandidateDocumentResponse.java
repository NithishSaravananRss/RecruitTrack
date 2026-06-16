package io.recruittrack.backend.documents.dto;

import io.recruittrack.backend.common.dto.UserSummaryDto;
import io.recruittrack.backend.common.enums.DocumentType;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class CandidateDocumentResponse {
    private UUID id;
    private UUID candidateId;
    private String fileName;
    private String fileUrl;
    private String mimeType;
    private Long fileSizeBytes;
    private DocumentType documentType;
    private Boolean isLatestResume;
    private UserSummaryDto uploadedBy;
    private Instant createdAt;
    private Instant updatedAt;
}
