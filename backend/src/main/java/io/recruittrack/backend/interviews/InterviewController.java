package io.recruittrack.backend.interviews;

import io.recruittrack.backend.common.dto.ApiResponse;
import io.recruittrack.backend.interviews.dto.*;
import io.recruittrack.backend.feedback.FeedbackService;
import io.recruittrack.backend.feedback.dto.FeedbackResponse;
import io.recruittrack.backend.security.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/interviews")
@RequiredArgsConstructor
public class InterviewController {

    private final InterviewService interviewService;
    private final FeedbackService feedbackService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'RECRUITER', 'HIRING_MANAGER')")
    public ResponseEntity<ApiResponse<io.recruittrack.backend.common.dto.PageResponse<InterviewResponse>>> getAllInterviews(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "scheduledAt,desc") String sort,
            @AuthenticationPrincipal UserPrincipal principal) {
        
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(page, Math.min(size, 100), 
                org.springframework.data.domain.Sort.by(
                        org.springframework.data.domain.Sort.Direction.fromString(sort.split(",").length > 1 ? sort.split(",")[1] : "desc"), 
                        sort.split(",")[0]
                ));
        io.recruittrack.backend.common.dto.PageResponse<InterviewResponse> response = interviewService.getAllInterviews(pageable, principal);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'RECRUITER', 'HIRING_MANAGER')")
    public ResponseEntity<ApiResponse<InterviewResponse>> scheduleInterview(
            @Valid @RequestBody ScheduleInterviewRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        InterviewResponse response = interviewService.scheduleInterview(request, principal);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response));
    }

    @GetMapping("/{interviewId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECRUITER', 'HIRING_MANAGER')")
    public ResponseEntity<ApiResponse<InterviewResponse>> getInterview(
            @PathVariable UUID interviewId,
            @AuthenticationPrincipal UserPrincipal principal) {
        InterviewResponse response = interviewService.getInterview(interviewId, principal);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/{interviewId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECRUITER', 'HIRING_MANAGER')")
    public ResponseEntity<ApiResponse<InterviewResponse>> updateInterview(
            @PathVariable UUID interviewId,
            @Valid @RequestBody UpdateInterviewRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        InterviewResponse response = interviewService.updateInterview(interviewId, request, principal);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PatchMapping("/{interviewId}/cancel")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECRUITER', 'HIRING_MANAGER')")
    public ResponseEntity<ApiResponse<InterviewResponse>> cancelInterview(
            @PathVariable UUID interviewId,
            @Valid @RequestBody CancelInterviewRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        InterviewResponse response = interviewService.cancelInterview(interviewId, request, principal);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PatchMapping("/{interviewId}/complete")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECRUITER', 'HIRING_MANAGER')")
    public ResponseEntity<ApiResponse<InterviewResponse>> completeInterview(
            @PathVariable UUID interviewId,
            @Valid @RequestBody CompleteInterviewRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        InterviewResponse response = interviewService.completeInterview(interviewId, request, principal);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{interviewId}/feedback")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECRUITER', 'HIRING_MANAGER')")
    public ResponseEntity<ApiResponse<io.recruittrack.backend.common.dto.PageResponse<FeedbackResponse>>> getFeedbackByInterview(
            @PathVariable UUID interviewId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt,desc") String sort,
            @AuthenticationPrincipal UserPrincipal principal) {
        
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(page, Math.min(size, 100), 
                org.springframework.data.domain.Sort.by(
                        org.springframework.data.domain.Sort.Direction.fromString(sort.split(",").length > 1 ? sort.split(",")[1] : "desc"), 
                        sort.split(",")[0]
                ));
        io.recruittrack.backend.common.dto.PageResponse<FeedbackResponse> response = feedbackService.getFeedbackByInterview(interviewId, pageable, principal);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
