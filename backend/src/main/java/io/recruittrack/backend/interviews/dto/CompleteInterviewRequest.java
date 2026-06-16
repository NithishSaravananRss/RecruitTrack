package io.recruittrack.backend.interviews.dto;

import lombok.Data;

@Data
public class CompleteInterviewRequest {
    
    // Kept for potential future expansion, e.g., summary notes at completion
    private String notes;
}
