package io.recruittrack.backend.feedback;

import io.recruittrack.backend.common.dto.ApiResponse;
import io.recruittrack.backend.feedback.dto.FeedbackResponse;
import io.recruittrack.backend.feedback.dto.SubmitFeedbackRequest;
import io.recruittrack.backend.feedback.dto.UpdateFeedbackRequest;
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
@RequestMapping("/api/v1/feedback")
@RequiredArgsConstructor
public class FeedbackController {

    private final FeedbackService feedbackService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'RECRUITER', 'HIRING_MANAGER')")
    public ResponseEntity<ApiResponse<FeedbackResponse>> submitFeedback(
            @Valid @RequestBody SubmitFeedbackRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        FeedbackResponse response = feedbackService.submitFeedback(request, principal);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response));
    }

    @GetMapping("/{feedbackId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECRUITER', 'HIRING_MANAGER')")
    public ResponseEntity<ApiResponse<FeedbackResponse>> getFeedback(
            @PathVariable UUID feedbackId,
            @AuthenticationPrincipal UserPrincipal principal) {
        FeedbackResponse response = feedbackService.getFeedback(feedbackId, principal);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/{feedbackId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECRUITER', 'HIRING_MANAGER')")
    public ResponseEntity<ApiResponse<FeedbackResponse>> updateFeedback(
            @PathVariable UUID feedbackId,
            @Valid @RequestBody UpdateFeedbackRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        FeedbackResponse response = feedbackService.updateFeedback(feedbackId, request, principal);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
