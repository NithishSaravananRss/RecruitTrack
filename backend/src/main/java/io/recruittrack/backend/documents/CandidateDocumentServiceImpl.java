package io.recruittrack.backend.documents;

import io.recruittrack.backend.candidates.Candidate;
import io.recruittrack.backend.candidates.CandidateRepository;
import io.recruittrack.backend.common.dto.PageResponse;
import io.recruittrack.backend.common.dto.UserSummaryDto;
import io.recruittrack.backend.common.enums.DocumentType;
import io.recruittrack.backend.common.exception.BusinessRuleException;
import io.recruittrack.backend.common.exception.ErrorCode;
import io.recruittrack.backend.common.exception.ResourceNotFoundException;
import io.recruittrack.backend.documents.dto.CandidateDocumentResponse;
import io.recruittrack.backend.documents.dto.CandidateDocumentSummaryResponse;
import io.recruittrack.backend.documents.dto.UploadDocumentRequest;
import io.recruittrack.backend.security.UserPrincipal;
import io.recruittrack.backend.users.User;
import io.recruittrack.backend.users.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CandidateDocumentServiceImpl implements CandidateDocumentService {

    private final CandidateDocumentRepository documentRepository;
    private final CandidateRepository candidateRepository;
    private final UserRepository userRepository;

    private static final List<String> ALLOWED_MIME_TYPES = List.of(
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );

    @Override
    @Transactional
    public CandidateDocumentResponse uploadDocument(UploadDocumentRequest request, UserPrincipal principal) {
        Candidate candidate = candidateRepository.findById(request.getCandidateId())
                .orElseThrow(() -> new ResourceNotFoundException("Candidate", request.getCandidateId()));

        if (!ALLOWED_MIME_TYPES.contains(request.getMimeType())) {
            throw new BusinessRuleException(ErrorCode.VALIDATION_FAILED, "Invalid MIME type");
        }

        User uploader = userRepository.getReferenceById(principal.getId());

        boolean isLatest = Boolean.TRUE.equals(request.getIsLatestResume()) && request.getDocumentType() == DocumentType.RESUME;

        if (isLatest) {
            documentRepository.unsetLatestResumeForCandidate(candidate.getId(), Instant.now());
        }

        CandidateDocument document = CandidateDocument.builder()
                .candidate(candidate)
                .fileName(request.getFileName())
                .fileUrl(request.getFileUrl())
                .mimeType(request.getMimeType())
                .fileSizeBytes(request.getFileSizeBytes())
                .documentType(request.getDocumentType())
                .isLatestResume(isLatest)
                .uploadedBy(uploader)
                .build();

        document = documentRepository.save(document);
        log.info("Document uploaded: id={}, candidateId={}, uploadedBy={}", document.getId(), candidate.getId(), uploader.getId());

        return toResponse(document);
    }

    @Override
    public PageResponse<CandidateDocumentSummaryResponse> getCandidateDocuments(UUID candidateId, Pageable pageable, UserPrincipal principal) {
        if (!candidateRepository.existsById(candidateId)) {
            throw new ResourceNotFoundException("Candidate", candidateId);
        }

        Page<CandidateDocument> page = documentRepository.findAllByCandidateId(candidateId, pageable);
        return PageResponse.from(page.map(this::toSummaryResponse));
    }

    @Override
    public CandidateDocumentResponse getDocument(UUID documentId, UserPrincipal principal) {
        CandidateDocument document = loadDocument(documentId);
        return toResponse(document);
    }

    @Override
    @Transactional
    public void deleteDocument(UUID documentId, UserPrincipal principal) {
        CandidateDocument document = loadDocument(documentId);
        
        // Allowed roles: ADMIN or the uploader
        if (!"ADMIN".equals(principal.getRole()) && !document.getUploadedBy().getId().equals(principal.getId())) {
            throw new BusinessRuleException(ErrorCode.UNAUTHORIZED, "You can only delete your own documents unless you are an ADMIN");
        }

        User deleter = userRepository.getReferenceById(principal.getId());
        documentRepository.softDeleteById(documentId, deleter, Instant.now());

        log.info("Document soft-deleted: id={}, by userId={}", documentId, principal.getId());
    }

    private CandidateDocument loadDocument(UUID id) {
        return documentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("CandidateDocument", id));
    }

    private CandidateDocumentResponse toResponse(CandidateDocument document) {
        return CandidateDocumentResponse.builder()
                .id(document.getId())
                .candidateId(document.getCandidate().getId())
                .fileName(document.getFileName())
                .fileUrl(document.getFileUrl())
                .mimeType(document.getMimeType())
                .fileSizeBytes(document.getFileSizeBytes())
                .documentType(document.getDocumentType())
                .isLatestResume(document.getIsLatestResume())
                .uploadedBy(UserSummaryDto.builder()
                        .id(document.getUploadedBy().getId())
                        .firstName(document.getUploadedBy().getFirstName())
                        .lastName(document.getUploadedBy().getLastName())
                        .email(document.getUploadedBy().getEmail())
                        .avatarUrl(document.getUploadedBy().getAvatarUrl())
                        .build())
                .createdAt(document.getCreatedAt())
                .updatedAt(document.getUpdatedAt())
                .build();
    }

    private CandidateDocumentSummaryResponse toSummaryResponse(CandidateDocument document) {
        return CandidateDocumentSummaryResponse.builder()
                .id(document.getId())
                .fileName(document.getFileName())
                .mimeType(document.getMimeType())
                .fileSizeBytes(document.getFileSizeBytes())
                .documentType(document.getDocumentType())
                .isLatestResume(document.getIsLatestResume())
                .createdAt(document.getCreatedAt())
                .build();
    }
}
