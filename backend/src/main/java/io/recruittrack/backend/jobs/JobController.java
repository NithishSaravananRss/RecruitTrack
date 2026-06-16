package io.recruittrack.backend.jobs;

import io.recruittrack.backend.common.dto.ApiResponse;
import io.recruittrack.backend.common.dto.PageResponse;
import io.recruittrack.backend.common.enums.*;
import io.recruittrack.backend.jobs.dto.*;
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
 * REST controller for the Jobs module.
 *
 * Base path: /api/v1/jobs
 *
 * Authorization:
 * - ADMIN, RECRUITER → full read + write access
 * - HIRING_MANAGER   → read-only, scoped to own assigned jobs (enforced in service)
 * - ADMIN only       → DELETE
 *
 * All responses use the ApiResponse<T> envelope.
 * Pagination uses the PageResponse<T> wrapper.
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/jobs")
@RequiredArgsConstructor
public class JobController {

    private final JobService jobService;

    // ─── POST /api/v1/jobs ────────────────────────────────────

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'RECRUITER')")
    public ResponseEntity<ApiResponse<JobResponse>> createJob(
            @Valid @RequestBody CreateJobRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {

        JobResponse response = jobService.createJob(request, principal);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(response));
    }

    // ─── GET /api/v1/jobs ─────────────────────────────────────

    /**
     * List all jobs with optional filters.
     *
     * Query params:
     * - search        → case-insensitive title/department/location match
     * - status        → JobStatus enum value
     * - department    → partial match
     * - workMode      → WorkMode enum value
     * - jobType       → JobType enum value
     * - seniorityLevel → SeniorityLevel enum value
     * - hiringManagerId → UUID (ADMIN/RECRUITER only; HMs are auto-scoped)
     * - page          → 0-indexed page number (default 0)
     * - size          → page size (default 20, max 100)
     * - sort          → field,direction e.g. "createdAt,desc"
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'RECRUITER', 'HIRING_MANAGER')")
    public ResponseEntity<ApiResponse<PageResponse<JobSummaryResponse>>> getJobs(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) JobStatus status,
            @RequestParam(required = false) String department,
            @RequestParam(required = false) WorkMode workMode,
            @RequestParam(required = false) JobType jobType,
            @RequestParam(required = false) SeniorityLevel seniorityLevel,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) UUID hiringManagerId,
            @RequestParam(defaultValue = "0")   int page,
            @RequestParam(defaultValue = "20")  int size,
            @RequestParam(defaultValue = "createdAt,desc") String sort,
            @AuthenticationPrincipal UserPrincipal principal) {

        Pageable pageable = buildPageable(page, Math.min(size, 100), sort);

        PageResponse<JobSummaryResponse> response = jobService.getJobs(
                search, status, department, workMode, jobType, seniorityLevel,
                location, hiringManagerId, pageable, principal);

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    // ─── GET /api/v1/jobs/{jobId} ─────────────────────────────

    @GetMapping("/{jobId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECRUITER', 'HIRING_MANAGER')")
    public ResponseEntity<ApiResponse<JobResponse>> getJob(
            @PathVariable UUID jobId,
            @AuthenticationPrincipal UserPrincipal principal) {

        JobResponse response = jobService.getJob(jobId, principal);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    // ─── PUT /api/v1/jobs/{jobId} ─────────────────────────────

    @PutMapping("/{jobId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECRUITER')")
    public ResponseEntity<ApiResponse<JobResponse>> updateJob(
            @PathVariable UUID jobId,
            @Valid @RequestBody UpdateJobRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {

        JobResponse response = jobService.updateJob(jobId, request, principal);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    // ─── PATCH /api/v1/jobs/{jobId}/status ───────────────────

    @PatchMapping("/{jobId}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECRUITER')")
    public ResponseEntity<ApiResponse<JobResponse>> updateJobStatus(
            @PathVariable UUID jobId,
            @Valid @RequestBody UpdateJobStatusRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {

        JobResponse response = jobService.updateJobStatus(jobId, request, principal);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    // ─── DELETE /api/v1/jobs/{jobId} ──────────────────────────

    @DeleteMapping("/{jobId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteJob(
            @PathVariable UUID jobId,
            @AuthenticationPrincipal UserPrincipal principal) {

        jobService.deleteJob(jobId, principal);
        return ResponseEntity.ok(ApiResponse.success(null, "Job deleted successfully"));
    }

    // ─── Helper ───────────────────────────────────────────────

    /**
     * Parse a "field,direction" sort string into a Spring Data Pageable.
     * Defaults to createdAt DESC on any parse error.
     */
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
