package io.recruittrack.backend.interviews.dto;

import lombok.Data;

@Data
public class CancelInterviewRequest {
    
    // Kept for potential future expansion, e.g., cancellationReason
    private String reason;
}
