package io.recruittrack.backend.applications;

import io.recruittrack.backend.applications.dto.*;
import io.recruittrack.backend.common.dto.ApiResponse;
import io.recruittrack.backend.common.dto.PageResponse;
import io.recruittrack.backend.security.UserPrincipal;
import io.recruittrack.backend.interviews.InterviewService;
import io.recruittrack.backend.interviews.dto.InterviewResponse;
import io.recruittrack.backend.feedback.FeedbackService;
import io.recruittrack.backend.feedback.dto.FeedbackResponse;
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
public class ApplicationController {

    private final ApplicationService applicationService;
    private final InterviewService interviewService;
    private final FeedbackService feedbackService;

    // ─── POST /api/v1/applications ──────────────────────────────

    @PostMapping("/applications")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECRUITER', 'HIRING_MANAGER')")
    public ResponseEntity<ApiResponse<ApplicationResponse>> createApplication(
            @Valid @RequestBody CreateApplicationRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        ApplicationResponse response = applicationService.createApplication(request, principal);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response));
    }

    // ─── GET /api/v1/applications/{applicationId} ───────────────

    @GetMapping("/applications/{applicationId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECRUITER', 'HIRING_MANAGER')")
    public ResponseEntity<ApiResponse<ApplicationResponse>> getApplication(
            @PathVariable UUID applicationId,
            @AuthenticationPrincipal UserPrincipal principal) {
        ApplicationResponse response = applicationService.getApplication(applicationId, principal);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    // ─── GET /api/v1/jobs/{jobId}/applications ──────────────────

    @GetMapping("/jobs/{jobId}/applications")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECRUITER', 'HIRING_MANAGER')")
    public ResponseEntity<ApiResponse<PageResponse<ApplicationSummaryResponse>>> getApplicationsByJob(
            @PathVariable UUID jobId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "appliedAt,desc") String sort,
            @AuthenticationPrincipal UserPrincipal principal) {
        
        Pageable pageable = buildPageable(page, Math.min(size, 100), sort);
        PageResponse<ApplicationSummaryResponse> response = applicationService.getApplicationsByJob(jobId, pageable, principal);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    // ─── GET /api/v1/candidates/{candidateId}/applications ──────

    @GetMapping("/candidates/{candidateId}/applications")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECRUITER', 'HIRING_MANAGER')")
    public ResponseEntity<ApiResponse<PageResponse<ApplicationSummaryResponse>>> getApplicationsByCandidate(
            @PathVariable UUID candidateId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "appliedAt,desc") String sort,
            @AuthenticationPrincipal UserPrincipal principal) {
        
        Pageable pageable = buildPageable(page, Math.min(size, 100), sort);
        PageResponse<ApplicationSummaryResponse> response = applicationService.getApplicationsByCandidate(candidateId, pageable, principal);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    // ─── GET /api/v1/applications/{applicationId}/interviews ────

    @GetMapping("/applications/{applicationId}/interviews")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECRUITER', 'HIRING_MANAGER')")
    public ResponseEntity<ApiResponse<PageResponse<InterviewResponse>>> getInterviewsByApplication(
            @PathVariable UUID applicationId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "scheduledAt,desc") String sort,
            @AuthenticationPrincipal UserPrincipal principal) {

        Pageable pageable = buildPageable(page, Math.min(size, 100), sort);
        PageResponse<InterviewResponse> response = interviewService.getInterviewsByApplication(applicationId, pageable, principal);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    // ─── GET /api/v1/applications/{applicationId}/feedback ──────

    @GetMapping("/applications/{applicationId}/feedback")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECRUITER', 'HIRING_MANAGER')")
    public ResponseEntity<ApiResponse<PageResponse<FeedbackResponse>>> getFeedbackByApplication(
            @PathVariable UUID applicationId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt,desc") String sort,
            @AuthenticationPrincipal UserPrincipal principal) {

        Pageable pageable = buildPageable(page, Math.min(size, 100), sort);
        PageResponse<FeedbackResponse> response = feedbackService.getFeedbackByApplication(applicationId, pageable, principal);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    // ─── PATCH /api/v1/applications/{applicationId}/stage ───────

    @PatchMapping("/applications/{applicationId}/stage")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECRUITER', 'HIRING_MANAGER')")
    public ResponseEntity<ApiResponse<ApplicationResponse>> moveApplicationStage(
            @PathVariable UUID applicationId,
            @Valid @RequestBody MoveApplicationStageRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        ApplicationResponse response = applicationService.moveApplicationStage(applicationId, request, principal);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    // ─── PATCH /api/v1/applications/{applicationId}/reject ──────

    @PatchMapping("/applications/{applicationId}/reject")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECRUITER', 'HIRING_MANAGER')")
    public ResponseEntity<ApiResponse<ApplicationResponse>> rejectApplication(
            @PathVariable UUID applicationId,
            @Valid @RequestBody RejectApplicationRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        ApplicationResponse response = applicationService.rejectApplication(applicationId, request, principal);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    // ─── Helper ───────────────────────────────────────────────

    private Pageable buildPageable(int page, int size, String sort) {
        try {
            String[] parts = sort.split(",");
            String field = parts[0].trim();
            Sort.Direction dir = parts.length > 1
                    ? Sort.Direction.fromString(parts[1].trim())
                    : Sort.Direction.DESC;
            return PageRequest.of(page, size, Sort.by(dir, field));
        } catch (Exception ex) {
            return PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "appliedAt"));
        }
    }
}
