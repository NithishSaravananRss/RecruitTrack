package io.recruittrack.backend.documents;

import io.recruittrack.backend.common.dto.PageResponse;
import io.recruittrack.backend.documents.dto.CandidateDocumentResponse;
import io.recruittrack.backend.documents.dto.CandidateDocumentSummaryResponse;
import io.recruittrack.backend.documents.dto.UploadDocumentRequest;
import io.recruittrack.backend.security.UserPrincipal;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface CandidateDocumentService {

    CandidateDocumentResponse uploadDocument(UploadDocumentRequest request, UserPrincipal principal);

    PageResponse<CandidateDocumentSummaryResponse> getCandidateDocuments(UUID candidateId, Pageable pageable, UserPrincipal principal);

    CandidateDocumentResponse getDocument(UUID documentId, UserPrincipal principal);

    void deleteDocument(UUID documentId, UserPrincipal principal);
}
