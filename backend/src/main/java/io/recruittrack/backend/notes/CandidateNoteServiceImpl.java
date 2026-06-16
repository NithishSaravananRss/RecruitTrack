package io.recruittrack.backend.notes;

import io.recruittrack.backend.candidates.Candidate;
import io.recruittrack.backend.candidates.CandidateRepository;
import io.recruittrack.backend.common.dto.PageResponse;
import io.recruittrack.backend.common.dto.UserSummaryDto;
import io.recruittrack.backend.common.exception.BusinessRuleException;
import io.recruittrack.backend.common.exception.ErrorCode;
import io.recruittrack.backend.common.exception.ResourceNotFoundException;
import io.recruittrack.backend.notes.dto.CandidateNoteResponse;
import io.recruittrack.backend.notes.dto.CreateNoteRequest;
import io.recruittrack.backend.notes.dto.UpdateNoteRequest;
import io.recruittrack.backend.security.UserPrincipal;
import io.recruittrack.backend.users.User;
import io.recruittrack.backend.users.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CandidateNoteServiceImpl implements CandidateNoteService {

    private final CandidateNoteRepository noteRepository;
    private final CandidateRepository candidateRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public CandidateNoteResponse createNote(CreateNoteRequest request, UserPrincipal principal) {
        Candidate candidate = candidateRepository.findById(request.getCandidateId())
                .orElseThrow(() -> new ResourceNotFoundException("Candidate", request.getCandidateId()));

        User creator = userRepository.getReferenceById(principal.getId());

        CandidateNote note = CandidateNote.builder()
                .candidate(candidate)
                .content(request.getContent())
                .isPrivate(request.getIsPrivate() != null ? request.getIsPrivate() : false)
                .createdBy(creator)
                .build();

        note = noteRepository.save(note);
        log.info("Note created: id={}, candidateId={}, by userId={}", note.getId(), candidate.getId(), principal.getId());

        return toResponse(note);
    }

    @Override
    public PageResponse<CandidateNoteResponse> getCandidateNotes(UUID candidateId, Pageable pageable, UserPrincipal principal) {
        if (!candidateRepository.existsById(candidateId)) {
            throw new ResourceNotFoundException("Candidate", candidateId);
        }

        boolean isAdmin = "ADMIN".equals(principal.getRole());

        Page<CandidateNote> page = noteRepository.findVisibleNotesForCandidate(candidateId, principal.getId(), isAdmin, pageable);
        return PageResponse.from(page.map(this::toResponse));
    }

    @Override
    @Transactional
    public CandidateNoteResponse updateNote(UUID noteId, UpdateNoteRequest request, UserPrincipal principal) {
        CandidateNote note = loadNote(noteId);

        if (!"ADMIN".equals(principal.getRole()) && !note.getCreatedBy().getId().equals(principal.getId())) {
            throw new BusinessRuleException(ErrorCode.UNAUTHORIZED, "You can only edit your own notes");
        }

        note.setContent(request.getContent());
        if (request.getIsPrivate() != null) {
            note.setIsPrivate(request.getIsPrivate());
        }

        note = noteRepository.save(note);
        log.info("Note updated: id={}, by userId={}", note.getId(), principal.getId());

        return toResponse(note);
    }

    @Override
    @Transactional
    public void deleteNote(UUID noteId, UserPrincipal principal) {
        CandidateNote note = loadNote(noteId);

        if (!"ADMIN".equals(principal.getRole()) && !note.getCreatedBy().getId().equals(principal.getId())) {
            throw new BusinessRuleException(ErrorCode.UNAUTHORIZED, "You can only delete your own notes");
        }

        User deleter = userRepository.getReferenceById(principal.getId());
        noteRepository.softDeleteById(noteId, deleter, Instant.now());

        log.info("Note soft-deleted: id={}, by userId={}", noteId, principal.getId());
    }

    private CandidateNote loadNote(UUID noteId) {
        return noteRepository.findById(noteId)
                .orElseThrow(() -> new ResourceNotFoundException("CandidateNote", noteId));
    }

    private CandidateNoteResponse toResponse(CandidateNote note) {
        return CandidateNoteResponse.builder()
                .id(note.getId())
                .candidateId(note.getCandidate().getId())
                .content(note.getContent())
                .isPrivate(note.getIsPrivate())
                .createdBy(UserSummaryDto.builder()
                        .id(note.getCreatedBy().getId())
                        .firstName(note.getCreatedBy().getFirstName())
                        .lastName(note.getCreatedBy().getLastName())
                        .email(note.getCreatedBy().getEmail())
                        .avatarUrl(note.getCreatedBy().getAvatarUrl())
                        .build())
                .createdAt(note.getCreatedAt())
                .updatedAt(note.getUpdatedAt())
                .build();
    }
}
