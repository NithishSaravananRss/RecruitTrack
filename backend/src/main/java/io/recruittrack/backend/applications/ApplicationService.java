package io.recruittrack.backend.applications;

import io.recruittrack.backend.applications.dto.ApplicationResponse;
import io.recruittrack.backend.applications.dto.ApplicationSummaryResponse;
import io.recruittrack.backend.applications.dto.CreateApplicationRequest;
import io.recruittrack.backend.applications.dto.MoveApplicationStageRequest;
import io.recruittrack.backend.applications.dto.RejectApplicationRequest;
import io.recruittrack.backend.common.dto.PageResponse;
import io.recruittrack.backend.security.UserPrincipal;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface ApplicationService {

    ApplicationResponse createApplication(CreateApplicationRequest request, UserPrincipal principal);

    ApplicationResponse getApplication(UUID applicationId, UserPrincipal principal);

    PageResponse<ApplicationSummaryResponse> getApplicationsByJob(UUID jobId, Pageable pageable, UserPrincipal principal);

    PageResponse<ApplicationSummaryResponse> getApplicationsByCandidate(UUID candidateId, Pageable pageable, UserPrincipal principal);

    ApplicationResponse moveApplicationStage(UUID applicationId, MoveApplicationStageRequest request, UserPrincipal principal);

    ApplicationResponse rejectApplication(UUID applicationId, RejectApplicationRequest request, UserPrincipal principal);
}
