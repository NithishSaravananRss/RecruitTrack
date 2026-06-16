package io.recruittrack.backend.candidates;

import io.recruittrack.backend.common.enums.CandidateSource;
import io.recruittrack.backend.users.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.SQLRestriction;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * JPA entity for the 'candidates' table.
 * Schema: approved Phase 2 database design — frozen.
 *
 * Soft delete: @SQLRestriction ensures soft-deleted candidates are invisible.
 *
 * skills: Stored as a PostgreSQL TEXT[] native array.
 *         Mapped via @JdbcTypeCode(SqlTypes.ARRAY) — requires PostgreSQL dialect.
 *         DTOs expose this as List<String>; the entity uses String[].
 *
 * email: Unique constraint at DB level. The service checks before insert.
 */
@Entity
@Table(name = "candidates")
@SQLRestriction("deleted_at IS NULL")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Candidate {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    @Column(name = "first_name", nullable = false, length = 100)
    private String firstName;

    @Column(name = "last_name", nullable = false, length = 100)
    private String lastName;

    @Column(nullable = false, unique = true, length = 320)
    private String email;

    @Column(length = 30)
    private String phone;

    @Column(length = 255)
    private String location;

    @Column(name = "current_title", length = 150)
    private String currentTitle;

    @Column(name = "current_company", length = 150)
    private String currentCompany;

    @Column(name = "years_of_experience", precision = 4, scale = 1)
    private BigDecimal yearsOfExperience;

    @Column(name = "linkedin_url", columnDefinition = "TEXT")
    private String linkedinUrl;

    @Column(name = "portfolio_url", columnDefinition = "TEXT")
    private String portfolioUrl;

    /**
     * Candidate's skill set stored as a PostgreSQL native TEXT[] array.
     * Hibernate 6 + PostgreSQL dialect handles the mapping automatically.
     * Example: {"Java", "Spring Boot", "PostgreSQL", "React"}
     */
    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "skills", columnDefinition = "TEXT[]")
    private String[] skills;

    @Enumerated(EnumType.STRING)
    @Column(length = 50)
    private CandidateSource source;

    /** Additional context for the source (e.g., "Referred by Jane Doe"). */
    @Column(name = "source_detail", length = 255)
    private String sourceDetail;

    @Column(name = "resume_url", columnDefinition = "TEXT")
    private String resumeUrl;

    @Column(name = "avatar_url", columnDefinition = "TEXT")
    private String avatarUrl;

    /**
     * Quick inline note about the candidate.
     * Distinct from the candidate_notes table (structured notes, Phase 9).
     */
    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "expected_salary_min", precision = 15, scale = 2)
    private BigDecimal expectedSalaryMin;

    @Column(name = "expected_salary_max", precision = 15, scale = 2)
    private BigDecimal expectedSalaryMax;
    @Column(name = "match_score")
    private Integer matchScore;

    @Column(name = "salary_currency", length = 10)
    @Builder.Default
    private String salaryCurrency = "USD";

    // ─── Relationships ────────────────────────────────────────

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false, updatable = false)
    private User createdBy;

    // ─── Timestamps ───────────────────────────────────────────

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Column(name = "deleted_at")
    private Instant deletedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "deleted_by")
    private User deletedBy;

    // ─── Lifecycle ────────────────────────────────────────────

    @PrePersist
    protected void onCreate() {
        Instant now = Instant.now();
        if (createdAt == null) createdAt = now;
        if (updatedAt == null) updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }

    // ─── Convenience ─────────────────────────────────────────

    public String getFullName() {
        return firstName + " " + lastName;
    }
}
