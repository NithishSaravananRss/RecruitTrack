package io.recruittrack.backend.documents.dto;

import io.recruittrack.backend.common.enums.DocumentType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.util.UUID;

@Data
public class UploadDocumentRequest {

    @NotNull(message = "Candidate ID is required")
    private UUID candidateId;

    @NotBlank(message = "File name is required")
    private String fileName;

    @NotBlank(message = "File URL is required")
    private String fileUrl;

    @NotBlank(message = "MIME type is required")
    private String mimeType;

    @NotNull(message = "File size is required")
    @Positive(message = "File size must be positive")
    private Long fileSizeBytes;

    @NotNull(message = "Document type is required")
    private DocumentType documentType;

    private Boolean isLatestResume = false;
}
