package io.recruittrack.backend.notes.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UpdateNoteRequest {

    @NotBlank(message = "Content cannot be empty")
    private String content;

    private Boolean isPrivate;
}
