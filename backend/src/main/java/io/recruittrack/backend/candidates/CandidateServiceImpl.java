package io.recruittrack.backend.candidates;

import io.recruittrack.backend.candidates.dto.CandidateResponse;
import io.recruittrack.backend.candidates.dto.CandidateSummaryResponse;
import io.recruittrack.backend.candidates.dto.CreateCandidateRequest;
import io.recruittrack.backend.candidates.dto.UpdateCandidateRequest;
import io.recruittrack.backend.common.dto.PageResponse;
import io.recruittrack.backend.common.dto.UserSummaryDto;
import io.recruittrack.backend.common.enums.CandidateSource;
import io.recruittrack.backend.common.exception.BusinessRuleException;
import io.recruittrack.backend.common.exception.ErrorCode;
import io.recruittrack.backend.common.exception.ResourceNotFoundException;
import io.recruittrack.backend.security.UserPrincipal;
import io.recruittrack.backend.users.User;
import io.recruittrack.backend.users.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CandidateServiceImpl implements CandidateService {

    private final CandidateRepository candidateRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public CandidateResponse createCandidate(CreateCandidateRequest request, UserPrincipal principal) {
        if (candidateRepository.existsByEmailIgnoreCase(request.getEmail())) {
            throw new BusinessRuleException(ErrorCode.EMAIL_ALREADY_EXISTS, "Candidate with this email already exists");
        }

        User creator = loadUser(principal.getId());

        Candidate candidate = Candidate.builder()
                .firstName(request.getFirstName().trim())
                .lastName(request.getLastName().trim())
                .email(request.getEmail().toLowerCase().trim())
                .phone(request.getPhone())
                .location(request.getLocation())
                .currentTitle(request.getCurrentTitle())
                .currentCompany(request.getCurrentCompany())
                .yearsOfExperience(request.getYearsOfExperience())
                .linkedinUrl(request.getLinkedinUrl())
                .portfolioUrl(request.getPortfolioUrl())
                .skills(request.getSkills() != null ? request.getSkills().toArray(new String[0]) : null)
                .source(request.getSource() != null ? request.getSource() : CandidateSource.DIRECT_APPLICATION)
                .sourceDetail(request.getSourceDetail())
                .resumeUrl(request.getResumeUrl())
                .avatarUrl(request.getAvatarUrl())
                .notes(request.getNotes())
                .expectedSalaryMin(request.getExpectedSalaryMin())
                .expectedSalaryMax(request.getExpectedSalaryMax())
                .salaryCurrency(request.getSalaryCurrency() != null ? request.getSalaryCurrency() : "USD")
                .createdBy(creator)
                .build();

        candidate = candidateRepository.save(candidate);
        log.info("Candidate created: id={}, email={}, by userId={}", candidate.getId(), candidate.getEmail(), principal.getId());

        return toCandidateResponse(candidate);
    }

    @Override
    public PageResponse<CandidateSummaryResponse> getCandidates(
            String search, CandidateSource source, String location, String skill, Integer experience,
            Pageable pageable, UserPrincipal principal) {

        Specification<Candidate> spec = Specification.where(null);
        spec = spec.and(CandidateSpecification.hasSource(source));
        spec = spec.and(CandidateSpecification.hasLocation(location));
        spec = spec.and(CandidateSpecification.hasSkill(skill));
        spec = spec.and(CandidateSpecification.searchContains(search));
        spec = spec.and(CandidateSpecification.hasMinimumExperience(experience));

        Page<CandidateSummaryResponse> page = candidateRepository.findAll(spec, pageable)
                .map(this::toCandidateSummaryResponse);

        return PageResponse.from(page);
    }

    @Override
    public CandidateResponse getCandidate(UUID candidateId, UserPrincipal principal) {
        Candidate candidate = loadCandidate(candidateId);
        return toCandidateResponse(candidate);
    }

    @Override
    @Transactional
    public CandidateResponse updateCandidate(UUID candidateId, UpdateCandidateRequest request, UserPrincipal principal) {
        Candidate candidate = loadCandidate(candidateId);

        if (candidateRepository.existsByEmailIgnoreCaseAndIdNot(request.getEmail(), candidateId)) {
            throw new BusinessRuleException(ErrorCode.EMAIL_ALREADY_EXISTS, "Another candidate with this email already exists");
        }

        candidate.setFirstName(request.getFirstName().trim());
        candidate.setLastName(request.getLastName().trim());
        candidate.setEmail(request.getEmail().toLowerCase().trim());
        candidate.setPhone(request.getPhone());
        candidate.setLocation(request.getLocation());
        candidate.setCurrentTitle(request.getCurrentTitle());
        candidate.setCurrentCompany(request.getCurrentCompany());
        candidate.setYearsOfExperience(request.getYearsOfExperience());
        candidate.setLinkedinUrl(request.getLinkedinUrl());
        candidate.setPortfolioUrl(request.getPortfolioUrl());
        candidate.setSkills(request.getSkills() != null ? request.getSkills().toArray(new String[0]) : null);
        candidate.setSource(request.getSource());
        candidate.setSourceDetail(request.getSourceDetail());
        candidate.setResumeUrl(request.getResumeUrl());
        candidate.setAvatarUrl(request.getAvatarUrl());
        candidate.setNotes(request.getNotes());
        candidate.setExpectedSalaryMin(request.getExpectedSalaryMin());
        candidate.setExpectedSalaryMax(request.getExpectedSalaryMax());
        if (request.getSalaryCurrency() != null) {
            candidate.setSalaryCurrency(request.getSalaryCurrency());
        }

        candidate = candidateRepository.save(candidate);
        log.info("Candidate updated: id={}, by userId={}", candidate.getId(), principal.getId());

        return toCandidateResponse(candidate);
    }

    @Override
    @Transactional
    public void deleteCandidate(UUID candidateId, UserPrincipal principal) {
        Candidate candidate = loadCandidate(candidateId);
        
        // Similar to jobs, guard for active applications will be enforced in Phase 7
        
        User deleter = loadUser(principal.getId());
        candidateRepository.softDeleteById(candidateId, deleter, Instant.now());
        
        log.info("Candidate soft-deleted: id={}, by userId={}", candidateId, principal.getId());
    }

    @Override
    @Transactional
    public String uploadResume(UUID candidateId, org.springframework.web.multipart.MultipartFile file, UserPrincipal principal) {
        Candidate candidate = loadCandidate(candidateId);
        
        if (file.isEmpty()) {
            throw new BusinessRuleException(ErrorCode.VALIDATION_FAILED, "File is empty");
        }

        try {
            // Save locally for phase 2
            String uploadsDir = System.getProperty("user.dir") + "/uploads/resumes";
            java.io.File dir = new java.io.File(uploadsDir);
            if (!dir.exists()) {
                dir.mkdirs();
            }

            String filename = candidateId.toString() + "_" + file.getOriginalFilename();
            java.nio.file.Path filePath = java.nio.file.Paths.get(uploadsDir, filename);
            java.nio.file.Files.copy(file.getInputStream(), filePath, java.nio.file.StandardCopyOption.REPLACE_EXISTING);

            String url = "/uploads/resumes/" + filename; // Assuming static serving or just simple URL mapping
            candidate.setResumeUrl(url);
            candidateRepository.save(candidate);
            
            return url;
        } catch (java.io.IOException e) {
            throw new BusinessRuleException(ErrorCode.INTERNAL_SERVER_ERROR, "Failed to upload resume");
        }
    }

    // ─── Mapping ──────────────────────────────────────────────

    private CandidateResponse toCandidateResponse(Candidate candidate) {
        List<String> skillsList = candidate.getSkills() != null ? Arrays.asList(candidate.getSkills()) : null;
        
        return CandidateResponse.builder()
                .id(candidate.getId())
                .firstName(candidate.getFirstName())
                .lastName(candidate.getLastName())
                .email(candidate.getEmail())
                .phone(candidate.getPhone())
                .location(candidate.getLocation())
                .currentTitle(candidate.getCurrentTitle())
                .currentCompany(candidate.getCurrentCompany())
                .yearsOfExperience(candidate.getYearsOfExperience())
                .linkedinUrl(candidate.getLinkedinUrl())
                .portfolioUrl(candidate.getPortfolioUrl())
                .skills(skillsList)
                .source(candidate.getSource())
                .sourceDetail(candidate.getSourceDetail())
                .resumeUrl(candidate.getResumeUrl())
                .avatarUrl(candidate.getAvatarUrl())
                .notes(candidate.getNotes())
                .expectedSalaryMin(candidate.getExpectedSalaryMin())
                .expectedSalaryMax(candidate.getExpectedSalaryMax())
                .salaryCurrency(candidate.getSalaryCurrency())
                .createdBy(toUserSummary(candidate.getCreatedBy()))
                .createdAt(candidate.getCreatedAt())
                .updatedAt(candidate.getUpdatedAt())
                .matchScore(candidate.getMatchScore() != null ? candidate.getMatchScore() : 80)
                .build();
    }

    private CandidateSummaryResponse toCandidateSummaryResponse(Candidate candidate) {
        List<String> skillsList = candidate.getSkills() != null ? Arrays.asList(candidate.getSkills()) : null;

        return CandidateSummaryResponse.builder()
                .id(candidate.getId())
                .firstName(candidate.getFirstName())
                .lastName(candidate.getLastName())
                .email(candidate.getEmail())
                .currentTitle(candidate.getCurrentTitle())
                .currentCompany(candidate.getCurrentCompany())
                .skills(skillsList)
                .source(candidate.getSource())
                .avatarUrl(candidate.getAvatarUrl())
                .resumeUrl(candidate.getResumeUrl())
                .phone(candidate.getPhone())
                .location(candidate.getLocation())
                .yearsOfExperience(candidate.getYearsOfExperience())
                .expectedSalaryMin(candidate.getExpectedSalaryMin())
                .expectedSalaryMax(candidate.getExpectedSalaryMax())
                .salaryCurrency(candidate.getSalaryCurrency())
                .matchScore(candidate.getMatchScore() != null ? candidate.getMatchScore() : 80)
                .build();
    }

    private UserSummaryDto toUserSummary(User user) {
        if (user == null) return null;
        return UserSummaryDto.builder()
                .id(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .email(user.getEmail())
                .avatarUrl(user.getAvatarUrl())
                .role(user.getRole())
                .build();
    }

    // ─── Internal Helpers ─────────────────────────────────────

    private Candidate loadCandidate(UUID candidateId) {
        return candidateRepository.findById(candidateId)
                .orElseThrow(() -> new ResourceNotFoundException("Candidate", candidateId));
    }

    private User loadUser(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));
    }
}
