package io.recruittrack.backend.interviews.dto;

import io.recruittrack.backend.applications.dto.ApplicationSummaryResponse;
import io.recruittrack.backend.common.dto.UserSummaryDto;
import io.recruittrack.backend.common.enums.InterviewStatus;
import io.recruittrack.backend.pipeline.dto.PipelineStageResponse;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class InterviewResponse {
    private UUID id;
    private ApplicationSummaryResponse application;
    private PipelineStageResponse stage;
    private InterviewStatus status;
    private Instant scheduledAt;
    private Integer durationMinutes;
    private String location;
    private String meetingLink;
    private String instructions;
    private List<UserSummaryDto> interviewers;
    private Instant createdAt;
    private Instant updatedAt;
}
