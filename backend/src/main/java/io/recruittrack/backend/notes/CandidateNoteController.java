package io.recruittrack.backend.notes;

import io.recruittrack.backend.common.dto.ApiResponse;
import io.recruittrack.backend.common.dto.PageResponse;
import io.recruittrack.backend.notes.dto.CandidateNoteResponse;
import io.recruittrack.backend.notes.dto.CreateNoteRequest;
import io.recruittrack.backend.notes.dto.UpdateNoteRequest;
import io.recruittrack.backend.security.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class CandidateNoteController {

    private final CandidateNoteService noteService;

    @PostMapping("/notes")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECRUITER', 'HIRING_MANAGER')")
    public ResponseEntity<ApiResponse<CandidateNoteResponse>> createNote(
            @Valid @RequestBody CreateNoteRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        CandidateNoteResponse response = noteService.createNote(request, principal);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response));
    }

    @GetMapping("/candidates/{candidateId}/notes")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECRUITER', 'HIRING_MANAGER')")
    public ResponseEntity<ApiResponse<PageResponse<CandidateNoteResponse>>> getCandidateNotes(
            @PathVariable UUID candidateId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt,desc") String sort,
            @AuthenticationPrincipal UserPrincipal principal) {

        Pageable pageable = buildPageable(page, Math.min(size, 100), sort);
        PageResponse<CandidateNoteResponse> response = noteService.getCandidateNotes(candidateId, pageable, principal);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/notes/{noteId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECRUITER', 'HIRING_MANAGER')")
    public ResponseEntity<ApiResponse<CandidateNoteResponse>> updateNote(
            @PathVariable UUID noteId,
            @Valid @RequestBody UpdateNoteRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        CandidateNoteResponse response = noteService.updateNote(noteId, request, principal);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @DeleteMapping("/notes/{noteId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECRUITER', 'HIRING_MANAGER')")
    public ResponseEntity<ApiResponse<Void>> deleteNote(
            @PathVariable UUID noteId,
            @AuthenticationPrincipal UserPrincipal principal) {
        noteService.deleteNote(noteId, principal);
        return ResponseEntity.ok(ApiResponse.success(null, "Note deleted successfully"));
    }

    private Pageable buildPageable(int page, int size, String sort) {
        try {
            String[] parts = sort.split(",");
            String field = parts[0].trim();
            Sort.Direction dir = parts.length > 1
                    ? Sort.Direction.fromString(parts[1].trim())
                    : Sort.Direction.DESC;
            return PageRequest.of(page, size, Sort.by(dir, field));
        } catch (Exception ex) {
            return PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        }
    }
}
