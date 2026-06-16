package io.recruittrack.backend.candidates;

import io.recruittrack.backend.candidates.dto.CandidateResponse;
import io.recruittrack.backend.candidates.dto.CandidateSummaryResponse;
import io.recruittrack.backend.candidates.dto.CreateCandidateRequest;
import io.recruittrack.backend.candidates.dto.UpdateCandidateRequest;
import io.recruittrack.backend.common.dto.ApiResponse;
import io.recruittrack.backend.common.dto.PageResponse;
import io.recruittrack.backend.common.enums.CandidateSource;
import io.recruittrack.backend.security.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * REST controller for the Candidates module.
 *
 * Base path: /api/v1/candidates
 *
 * Authorization:
 * - ADMIN, RECRUITER, HIRING_MANAGER → full read + write access
 * - ADMIN only                       → DELETE
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/candidates")
@RequiredArgsConstructor
public class CandidateController {

    private final CandidateService candidateService;

    // ─── POST /api/v1/candidates ──────────────────────────────

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'RECRUITER', 'HIRING_MANAGER')")
    public ResponseEntity<ApiResponse<CandidateResponse>> createCandidate(
            @Valid @RequestBody CreateCandidateRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {

        CandidateResponse response = candidateService.createCandidate(request, principal);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(response));
    }

    // ─── GET /api/v1/candidates ───────────────────────────────

    /**
     * List all candidates with optional filters.
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'RECRUITER', 'HIRING_MANAGER')")
    public ResponseEntity<ApiResponse<PageResponse<CandidateSummaryResponse>>> getCandidates(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) CandidateSource source,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) String skill,
            @RequestParam(required = false) Integer experience,
            @RequestParam(defaultValue = "0")   int page,
            @RequestParam(defaultValue = "20")  int size,
            @RequestParam(defaultValue = "createdAt,desc") String sort,
            @AuthenticationPrincipal UserPrincipal principal) {

        Pageable pageable = buildPageable(page, Math.min(size, 100), sort);

        PageResponse<CandidateSummaryResponse> response = candidateService.getCandidates(
                search, source, location, skill, experience, pageable, principal);

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    // ─── GET /api/v1/candidates/{candidateId} ─────────────────

    @GetMapping("/{candidateId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECRUITER', 'HIRING_MANAGER')")
    public ResponseEntity<ApiResponse<CandidateResponse>> getCandidate(
            @PathVariable UUID candidateId,
            @AuthenticationPrincipal UserPrincipal principal) {

        CandidateResponse response = candidateService.getCandidate(candidateId, principal);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    // ─── PUT /api/v1/candidates/{candidateId} ─────────────────

    @PutMapping("/{candidateId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECRUITER', 'HIRING_MANAGER')")
    public ResponseEntity<ApiResponse<CandidateResponse>> updateCandidate(
            @PathVariable UUID candidateId,
            @Valid @RequestBody UpdateCandidateRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {

        CandidateResponse response = candidateService.updateCandidate(candidateId, request, principal);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    // ─── DELETE /api/v1/candidates/{candidateId} ──────────────

    @DeleteMapping("/{candidateId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteCandidate(
            @PathVariable UUID candidateId,
            @AuthenticationPrincipal UserPrincipal principal) {

        candidateService.deleteCandidate(candidateId, principal);
        return ResponseEntity.ok(ApiResponse.success(null, "Candidate deleted successfully"));
    }

    // ─── POST /api/v1/candidates/{candidateId}/resume ─────────

    @PostMapping("/{candidateId}/resume")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECRUITER', 'HIRING_MANAGER')")
    public ResponseEntity<ApiResponse<String>> uploadResume(
            @PathVariable UUID candidateId,
            @RequestParam("file") org.springframework.web.multipart.MultipartFile file,
            @AuthenticationPrincipal UserPrincipal principal) {

        String url = candidateService.uploadResume(candidateId, file, principal);
        return ResponseEntity.ok(ApiResponse.success(url, "Resume uploaded successfully"));
    }

    // ─── Helper ───────────────────────────────────────────────

    private Pageable buildPageable(int page, int size, String sort) {
        try {
            String[] parts = sort.split(",");
            String field     = parts[0].trim();
            Sort.Direction dir = parts.length > 1
                    ? Sort.Direction.fromString(parts[1].trim())
                    : Sort.Direction.DESC;
            return PageRequest.of(page, size, Sort.by(dir, field));
        } catch (Exception ex) {
            return PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        }
    }
}
