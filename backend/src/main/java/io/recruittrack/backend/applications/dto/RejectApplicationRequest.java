package io.recruittrack.backend.applications.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class RejectApplicationRequest {
    
    @NotBlank(message = "Rejection reason is required")
    private String rejectionReason;
}
