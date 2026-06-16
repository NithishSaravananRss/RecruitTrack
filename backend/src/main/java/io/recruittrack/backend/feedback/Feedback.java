package io.recruittrack.backend.feedback;

import io.recruittrack.backend.applications.Application;
import io.recruittrack.backend.interviews.Interview;
import io.recruittrack.backend.users.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.SQLRestriction;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.UUID;

/**
 * JPA entity for the 'feedback' table.
 */
@Entity
@Table(name = "feedback")
@SQLRestriction("deleted_at IS NULL")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Feedback {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "interview_id", nullable = false)
    private Interview interview;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "application_id", nullable = false)
    private Application application;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "interviewer_id", nullable = false)
    private User interviewer;

    /**
     * General overall recommendation. e.g. "STRONG HIRE", "HIRE", "NO HIRE"
     */
    @Column(length = 50)
    private String recommendation;

    @Column(name = "overall_comments", columnDefinition = "TEXT")
    private String overallComments;

    /**
     * Ratings stored as JSONB.
     * Example: [{"attribute": "Problem Solving", "rating": 4, "comment": "Good"}]
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "ratings_json", columnDefinition = "jsonb")
    private String ratingsJson;

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
}
