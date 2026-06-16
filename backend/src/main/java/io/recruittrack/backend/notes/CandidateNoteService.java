package io.recruittrack.backend.notes;

import io.recruittrack.backend.common.dto.PageResponse;
import io.recruittrack.backend.notes.dto.CandidateNoteResponse;
import io.recruittrack.backend.notes.dto.CreateNoteRequest;
import io.recruittrack.backend.notes.dto.UpdateNoteRequest;
import io.recruittrack.backend.security.UserPrincipal;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface CandidateNoteService {

    CandidateNoteResponse createNote(CreateNoteRequest request, UserPrincipal principal);

    PageResponse<CandidateNoteResponse> getCandidateNotes(UUID candidateId, Pageable pageable, UserPrincipal principal);

    CandidateNoteResponse updateNote(UUID noteId, UpdateNoteRequest request, UserPrincipal principal);

    void deleteNote(UUID noteId, UserPrincipal principal);
}
