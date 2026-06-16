package io.recruittrack.backend.interviews;

import io.recruittrack.backend.common.dto.PageResponse;
import io.recruittrack.backend.interviews.dto.*;
import io.recruittrack.backend.security.UserPrincipal;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface InterviewService {

    InterviewResponse scheduleInterview(ScheduleInterviewRequest request, UserPrincipal principal);

    InterviewResponse getInterview(UUID interviewId, UserPrincipal principal);

    PageResponse<InterviewResponse> getAllInterviews(Pageable pageable, UserPrincipal principal);

    PageResponse<InterviewResponse> getInterviewsByApplication(UUID applicationId, Pageable pageable, UserPrincipal principal);

    InterviewResponse updateInterview(UUID interviewId, UpdateInterviewRequest request, UserPrincipal principal);

    InterviewResponse cancelInterview(UUID interviewId, CancelInterviewRequest request, UserPrincipal principal);

    InterviewResponse completeInterview(UUID interviewId, CompleteInterviewRequest request, UserPrincipal principal);
}
