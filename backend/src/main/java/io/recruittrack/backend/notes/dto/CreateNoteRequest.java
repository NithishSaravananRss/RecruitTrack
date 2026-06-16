package io.recruittrack.backend.notes.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class CreateNoteRequest {

    @NotNull(message = "Candidate ID is required")
    private UUID candidateId;

    @NotBlank(message = "Content cannot be empty")
    private String content;

    private Boolean isPrivate = false;
}
