package io.recruittrack.backend.documents;

import io.recruittrack.backend.common.dto.ApiResponse;
import io.recruittrack.backend.common.dto.PageResponse;
import io.recruittrack.backend.documents.dto.CandidateDocumentResponse;
import io.recruittrack.backend.documents.dto.CandidateDocumentSummaryResponse;
import io.recruittrack.backend.documents.dto.UploadDocumentRequest;
import io.recruittrack.backend.security.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class CandidateDocumentController {

    private final CandidateDocumentService documentService;

    @PostMapping("/documents/upload")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECRUITER', 'HIRING_MANAGER')")
    public ResponseEntity<ApiResponse<CandidateDocumentResponse>> uploadDocument(
            @Valid @RequestBody UploadDocumentRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        CandidateDocumentResponse response = documentService.uploadDocument(request, principal);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response));
    }

    @GetMapping("/candidates/{candidateId}/documents")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECRUITER', 'HIRING_MANAGER')")
    public ResponseEntity<ApiResponse<PageResponse<CandidateDocumentSummaryResponse>>> getCandidateDocuments(
            @PathVariable UUID candidateId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt,desc") String sort,
            @AuthenticationPrincipal UserPrincipal principal) {
        
        Pageable pageable = buildPageable(page, Math.min(size, 100), sort);
        PageResponse<CandidateDocumentSummaryResponse> response = documentService.getCandidateDocuments(candidateId, pageable, principal);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/documents/{documentId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECRUITER', 'HIRING_MANAGER')")
    public ResponseEntity<ApiResponse<CandidateDocumentResponse>> getDocument(
            @PathVariable UUID documentId,
            @AuthenticationPrincipal UserPrincipal principal) {
        CandidateDocumentResponse response = documentService.getDocument(documentId, principal);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @DeleteMapping("/documents/{documentId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECRUITER', 'HIRING_MANAGER')")
    public ResponseEntity<ApiResponse<Void>> deleteDocument(
            @PathVariable UUID documentId,
            @AuthenticationPrincipal UserPrincipal principal) {
        documentService.deleteDocument(documentId, principal);
        return ResponseEntity.ok(ApiResponse.success(null, "Document deleted successfully"));
    }

    private Pageable buildPageable(int page, int size, String sort) {
        try {
            String[] parts = sort.split(",");
            String field = parts[0].trim();
            Sort.Direction dir = parts.length > 1
                    ? Sort.Direction.fromString(parts[1].trim())
                    : Sort.Direction.DESC;
            return PageRequest.of(page, size, Sort.by(dir, field));
        } catch (Exception ex) {
            return PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        }
    }
}
