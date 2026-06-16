package io.recruittrack.backend.feedback;

import io.recruittrack.backend.feedback.dto.FeedbackResponse;
import io.recruittrack.backend.feedback.dto.SubmitFeedbackRequest;
import io.recruittrack.backend.feedback.dto.UpdateFeedbackRequest;
import io.recruittrack.backend.security.UserPrincipal;
import io.recruittrack.backend.common.dto.PageResponse;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface FeedbackService {

    FeedbackResponse submitFeedback(SubmitFeedbackRequest request, UserPrincipal principal);

    FeedbackResponse getFeedback(UUID feedbackId, UserPrincipal principal);

    FeedbackResponse updateFeedback(UUID feedbackId, UpdateFeedbackRequest request, UserPrincipal principal);

    PageResponse<FeedbackResponse> getFeedbackByApplication(UUID applicationId, Pageable pageable, UserPrincipal principal);

    PageResponse<FeedbackResponse> getFeedbackByInterview(UUID interviewId, Pageable pageable, UserPrincipal principal);
}
