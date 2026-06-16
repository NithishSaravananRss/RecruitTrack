package io.recruittrack.backend.candidates;

import io.recruittrack.backend.candidates.dto.CandidateResponse;
import io.recruittrack.backend.candidates.dto.CandidateSummaryResponse;
import io.recruittrack.backend.candidates.dto.CreateCandidateRequest;
import io.recruittrack.backend.candidates.dto.UpdateCandidateRequest;
import io.recruittrack.backend.common.dto.PageResponse;
import io.recruittrack.backend.common.enums.CandidateSource;
import io.recruittrack.backend.security.UserPrincipal;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

/**
 * Contract for the Candidates business module.
 */
public interface CandidateService {

    CandidateResponse createCandidate(CreateCandidateRequest request, UserPrincipal principal);

    PageResponse<CandidateSummaryResponse> getCandidates(
            String search,
            CandidateSource source,
            String location,
            String skill,
            Integer experience,
            Pageable pageable,
            UserPrincipal principal);

    CandidateResponse getCandidate(UUID candidateId, UserPrincipal principal);

    CandidateResponse updateCandidate(UUID candidateId, UpdateCandidateRequest request, UserPrincipal principal);

    String uploadResume(UUID candidateId, org.springframework.web.multipart.MultipartFile file, UserPrincipal principal);

    void deleteCandidate(UUID candidateId, UserPrincipal principal);
}
