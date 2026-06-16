package io.recruittrack.backend.pipeline;

import io.recruittrack.backend.applications.Application;
import io.recruittrack.backend.applications.ApplicationRepository;
import io.recruittrack.backend.candidates.Candidate;
import io.recruittrack.backend.candidates.CandidateRepository;
import io.recruittrack.backend.candidates.CandidateTimelineEvent;
import io.recruittrack.backend.candidates.CandidateTimelineEventRepository;
import io.recruittrack.backend.common.enums.*;
import io.recruittrack.backend.documents.CandidateDocument;
import io.recruittrack.backend.documents.CandidateDocumentRepository;
import io.recruittrack.backend.feedback.Feedback;
import io.recruittrack.backend.feedback.FeedbackRepository;
import io.recruittrack.backend.interviews.Interview;
import io.recruittrack.backend.interviews.InterviewRepository;
import io.recruittrack.backend.jobs.Job;
import io.recruittrack.backend.jobs.JobRepository;
import io.recruittrack.backend.notes.CandidateNote;
import io.recruittrack.backend.notes.CandidateNoteRepository;
import io.recruittrack.backend.notifications.Notification;
import io.recruittrack.backend.notifications.NotificationRepository;
import io.recruittrack.backend.audit.SystemAuditLog;
import io.recruittrack.backend.audit.SystemAuditLogRepository;
import io.recruittrack.backend.users.User;
import io.recruittrack.backend.users.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Random;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
@Order(3)
public class DemoDataSeeder implements CommandLineRunner {

    private final JobRepository jobRepository;
    private final CandidateRepository candidateRepository;
    private final ApplicationRepository applicationRepository;
    private final PipelineStageRepository pipelineStageRepository;
    private final InterviewRepository interviewRepository;
    private final FeedbackRepository feedbackRepository;
    private final CandidateDocumentRepository documentRepository;
    private final CandidateNoteRepository noteRepository;
    private final UserRepository userRepository;
    private final CandidateTimelineEventRepository timelineEventRepository;
    private final NotificationRepository notificationRepository;
    private final SystemAuditLogRepository auditLogRepository;

    private final Random random = new Random();
    private Instant now = Instant.now();

    @Override
    @Transactional
    public void run(String... args) {
        if (jobRepository.count() >= 12) {
            log.info("Jobs already seeded. Skipping DemoDataSeeder.");
            return;
        }

        log.info("Starting DemoDataSeeder to generate realistic demo data...");

        Optional<User> recruiterOpt = userRepository.findByEmailIgnoreCase("recruiter@recruittrack.io");
        Optional<User> managerOpt = userRepository.findByEmailIgnoreCase("manager@recruittrack.io");

        if (recruiterOpt.isEmpty() || managerOpt.isEmpty()) {
            log.error("Required demo users not found.");
            return;
        }

        User recruiter = recruiterOpt.get();
        User manager = managerOpt.get();

        // We assume the DB has been truncated for fresh seating
        if (jobRepository.count() > 0) {
            log.info("Jobs already seeded. Skipping DemoDataSeeder.");
            return;
        }

        // 1. Create Jobs (15+ active jobs)
        List<Job> jobs = new ArrayList<>();
        String[] jobTitles = {"Senior Frontend Engineer", "Java Backend Developer", "DevOps Engineer", "Product Manager", "UX Designer", "Data Scientist", "Marketing Specialist", "Sales Representative", "HR Manager", "Customer Support Lead", "Full Stack Developer", "Cloud Architect", "Security Engineer", "QA Automation Engineer", "Scrum Master", "Mobile Developer (iOS)", "Site Reliability Engineer"};
        String[] departments = {"Engineering", "Engineering", "Platform", "Product", "Design", "Data", "Marketing", "Sales", "HR", "Support", "Engineering", "Platform", "Security", "Engineering", "Product", "Engineering", "Platform"};
        String[] locations = {"Remote", "New York, NY", "London, UK", "San Francisco, CA", "Berlin, DE", "Toronto, CA", "Remote", "Chicago, IL", "Remote", "Austin, TX", "Seattle, WA", "Remote", "Remote", "Boston, MA", "Denver, CO", "Remote", "New York, NY"};

        for (int i = 0; i < jobTitles.length; i++) {
            Instant jobCreatedAt = now.minus(random.nextInt(180) + 10, ChronoUnit.DAYS);
            Job job = Job.builder()
                    .title(jobTitles[i])
                    .department(departments[i])
                    .location(locations[i])
                    .workMode(WorkMode.HYBRID)
                    .jobType(JobType.FULL_TIME)
                    .seniorityLevel(SeniorityLevel.values()[random.nextInt(SeniorityLevel.values().length)])
                    .status(random.nextDouble() > 0.1 ? JobStatus.ACTIVE : JobStatus.CLOSED)
                    .headcount(random.nextInt(3) + 1)
                    .reqId("RT-" + jobCreatedAt.toString().substring(0, 4) + "-" + (100 + random.nextInt(900)))
                    .createdBy(recruiter)
                    .hiringManager(manager)
                    .publishedAt(jobCreatedAt)
                    .createdAt(jobCreatedAt)
                    .updatedAt(jobCreatedAt)
                    .build();
            jobs.add(jobRepository.save(job));
        }

        // 2. Create Candidates & Applications (80-100 candidates)
        String[] firstNames = {"Alice", "Bob", "Charlie", "Diana", "Evan", "Fiona", "George", "Hannah", "Ian", "Julia", "Kevin", "Laura", "Mike", "Nina", "Oscar", "Paul", "Quinn", "Rachel", "Sam", "Tina", "Uma", "Victor", "Wendy", "Xander", "Yara", "Zack"};
        String[] lastNames = {"Smith", "Johnson", "Williams", "Jones", "Brown", "Davis", "Miller", "Wilson", "Moore", "Taylor", "Anderson", "Thomas", "Jackson", "White", "Harris", "Martin", "Thompson", "Garcia", "Martinez", "Robinson", "Clark", "Rodriguez", "Lewis", "Lee", "Walker", "Hall"};
        String[] skillsArr = {"Java, Spring Boot, React", "Python, Django, AWS", "JavaScript, TypeScript, Node.js", "Docker, Kubernetes, Terraform", "Figma, Sketch, Adobe XD", "SQL, Tableau, Machine Learning", "Go, Microservices", "C++, Unreal Engine", "Swift, iOS, CoreData", "Ruby on Rails, PostgreSQL"};
        
        List<PipelineStage> stages = pipelineStageRepository.findAllByOrderByPositionAsc();
        if (stages.isEmpty()) {
            log.error("Pipeline stages not found. Cannot proceed.");
            return;
        }

        int totalCandidates = 90;
        int notifCount = 0;
        int auditCount = 0;

        for (int i = 0; i < totalCandidates; i++) {
            Job job = jobs.get(random.nextInt(jobs.size()));
            Instant appliedAt = job.getCreatedAt().plus(random.nextInt(30) + 1, ChronoUnit.DAYS);
            if (appliedAt.isAfter(now)) appliedAt = now.minus(1, ChronoUnit.DAYS);

            String fn = firstNames[random.nextInt(firstNames.length)];
            String ln = lastNames[random.nextInt(lastNames.length)];
            
            Candidate candidate = Candidate.builder()
                    .firstName(fn)
                    .lastName(ln)
                    .email(fn.toLowerCase() + "." + ln.toLowerCase() + i + "@example.com")
                    .phone("+1555" + (100000 + random.nextInt(900000)))
                    .location(locations[random.nextInt(locations.length)])
                    .skills(new String[]{skillsArr[random.nextInt(skillsArr.length)]})
                    .yearsOfExperience(BigDecimal.valueOf(random.nextInt(15) + 1))
                    .currentCompany("Company " + (char)('A' + random.nextInt(26)))
                    .currentTitle(jobTitles[random.nextInt(jobTitles.length)])
                    .expectedSalaryMin(BigDecimal.valueOf(80000 + random.nextInt(40000)))
                    .expectedSalaryMax(BigDecimal.valueOf(130000 + random.nextInt(50000)))
                    .salaryCurrency("USD")
                    .source(CandidateSource.values()[random.nextInt(CandidateSource.values().length)])
                    .matchScore(65 + random.nextInt(35))
                    .createdBy(recruiter)
                    .createdAt(appliedAt)
                    .updatedAt(appliedAt)
                    .build();
            candidate = candidateRepository.save(candidate);

            // Determine stage distribution (applied: 20%, screening: 20%, technical: 20%, manager: 10%, offer: 10%, hired: 10%, rejected: 10%)
            int stageIdx = 0;
            double rand = random.nextDouble();
            if (rand > 0.2) stageIdx = 1;
            if (rand > 0.4) stageIdx = 2;
            if (rand > 0.6) stageIdx = 3;
            if (rand > 0.7) stageIdx = 4; 
            if (rand > 0.8) stageIdx = 5; // offer
            if (rand > 0.9) stageIdx = 6; // hired
            if (rand > 0.95) stageIdx = 7; // rejected

            if (stageIdx >= stages.size()) stageIdx = stages.size() - 1;
            PipelineStage currentStage = stages.get(stageIdx);

            Application application = Application.builder()
                    .job(job)
                    .candidate(candidate)
                    .currentStage(currentStage)
                    .appliedAt(appliedAt)
                    .createdAt(appliedAt)
                    .updatedAt(appliedAt)
                    .isRejected(currentStage.getStageType().equalsIgnoreCase("rejected"))
                    .build();
            application = applicationRepository.save(application);

            // Timeline Event for Applied
            CandidateTimelineEvent event = CandidateTimelineEvent.builder()
                    .candidate(candidate)
                    .eventType("APPLICATION_SUBMITTED")
                    .title("Application Submitted")
                    .description("Applied for " + job.getTitle())
                    .createdBy(recruiter)
                    .createdAt(appliedAt)
                    .build();
            timelineEventRepository.save(event);

            // Generate Stage History if progressed
            if (stageIdx > 0) {
                Instant currentStageTime = appliedAt.plus(1, ChronoUnit.DAYS);
            }

            // Documents (Every candidate gets a resume)
            CandidateDocument doc = CandidateDocument.builder()
                    .candidate(candidate)
                    .documentType(DocumentType.RESUME)
                    .fileName(fn + "_" + ln + "_Resume.pdf")
                    .fileSizeBytes((long) (200000 + random.nextInt(800000)))
                    .fileUrl("https://s3.amazonaws.com/recruittrack-demo/resumes/" + candidate.getId() + ".pdf")
                    .mimeType("application/pdf")
                    .isLatestResume(true)
                    .uploadedBy(recruiter)
                    .createdAt(appliedAt.plus(1, ChronoUnit.MINUTES))
                    .updatedAt(appliedAt.plus(1, ChronoUnit.MINUTES))
                    .build();
            documentRepository.save(doc);
            
            candidate.setResumeUrl(doc.getFileUrl());
            candidateRepository.save(candidate);

            // Subset gets cover letter
            if (random.nextDouble() > 0.6) {
                CandidateDocument cover = CandidateDocument.builder()
                        .candidate(candidate)
                        .documentType(DocumentType.COVER_LETTER)
                        .fileName(fn + "_" + ln + "_CoverLetter.pdf")
                        .fileSizeBytes((long) (50000 + random.nextInt(100000)))
                        .fileUrl("https://s3.amazonaws.com/recruittrack-demo/covers/" + candidate.getId() + ".pdf")
                        .mimeType("application/pdf")
                        .isLatestResume(false)
                        .uploadedBy(recruiter)
                        .createdAt(appliedAt.plus(2, ChronoUnit.MINUTES))
                        .updatedAt(appliedAt.plus(2, ChronoUnit.MINUTES))
                        .build();
                documentRepository.save(cover);
            }

            // Notes (Multiple per candidate)
            for (int n = 0; n < random.nextInt(3) + 1; n++) {
                CandidateNote note = CandidateNote.builder()
                        .candidate(candidate)
                        .content("Review note " + (n + 1) + ": " + fn + " looks very promising. " + 
                                "Matched well with requirements: " + skillsArr[random.nextInt(skillsArr.length)])
                        .isPrivate(false)
                        .createdBy(n % 2 == 0 ? recruiter : manager)
                        .createdAt(appliedAt.plus(n + 1, ChronoUnit.DAYS))
                        .updatedAt(appliedAt.plus(n + 1, ChronoUnit.DAYS))
                        .build();
                noteRepository.save(note);
            }

            // Interviews
            if (stageIdx >= 2) {
                Instant interviewTime = appliedAt.plus(5, ChronoUnit.DAYS);
                if (interviewTime.isAfter(now.plus(14, ChronoUnit.DAYS))) interviewTime = now.plus(14, ChronoUnit.DAYS);
                
                InterviewStatus intStatus;
                if (interviewTime.isBefore(now)) {
                    intStatus = (random.nextDouble() > 0.1) ? InterviewStatus.COMPLETED : InterviewStatus.CANCELLED;
                } else {
                    intStatus = InterviewStatus.SCHEDULED;
                }

                Interview interview = Interview.builder()
                        .application(application)
                        .stage(stages.get(2))
                        .createdBy(recruiter)
                        .interviewerIds(new UUID[]{manager.getId()})
                        .scheduledAt(interviewTime)
                        .durationMinutes(60)
                        .status(intStatus)
                        .meetingLink("https://meet.google.com/abc-defg-hij")
                        .createdAt(interviewTime.minus(3, ChronoUnit.DAYS))
                        .updatedAt(interviewTime.minus(3, ChronoUnit.DAYS))
                        .build();
                interview = interviewRepository.save(interview);

                CandidateTimelineEvent intEvent = CandidateTimelineEvent.builder()
                        .candidate(candidate)
                        .eventType("INTERVIEW_SCHEDULED")
                        .title("Interview Scheduled")
                        .description("Technical interview scheduled with hiring manager.")
                        .createdBy(recruiter)
                        .createdAt(interviewTime.minus(3, ChronoUnit.DAYS))
                        .build();
                timelineEventRepository.save(intEvent);

                if (intStatus == InterviewStatus.COMPLETED) {
                    Feedback feedback = Feedback.builder()
                            .interview(interview)
                            .application(application)
                            .interviewer(manager)
                            .recommendation(new String[]{"STRONG HIRE", "HIRE", "LEANING HIRE", "NO HIRE"}[random.nextInt(4)])
                            .overallComments("Candidate communicated effectively. Excellent domain knowledge.")
                            .ratingsJson("[{\"attribute\": \"Technical Skills\", \"rating\": 4, \"comment\": \"Solid\"}, {\"attribute\": \"Culture Fit\", \"rating\": 5, \"comment\": \"Great fit\"}]")
                            .createdAt(interviewTime.plus(2, ChronoUnit.HOURS))
                            .updatedAt(interviewTime.plus(2, ChronoUnit.HOURS))
                            .build();
                    feedbackRepository.save(feedback);
                    
                    CandidateTimelineEvent fbEvent = CandidateTimelineEvent.builder()
                            .candidate(candidate)
                            .eventType("FEEDBACK_SUBMITTED")
                            .title("Interview Feedback")
                            .description("Feedback submitted by manager.")
                            .createdBy(manager)
                            .createdAt(interviewTime.plus(2, ChronoUnit.HOURS))
                            .build();
                    timelineEventRepository.save(fbEvent);
                }
            }

            // Audit Logs (At least 1 per candidate)
            SystemAuditLog audit = SystemAuditLog.builder()
                    .actionType("CANDIDATE_CREATED")
                    .entityType("CANDIDATE")
                    .entityId(candidate.getId())
                    .userId(recruiter.getId())
                    .userName(recruiter.getEmail())
                    .description("Created candidate " + fn + " " + ln)
                    .timestamp(appliedAt)
                    .build();
            auditLogRepository.save(audit);
            auditCount++;

            // Extra audit log for stage change
            if (stageIdx > 0) {
                SystemAuditLog auditStage = SystemAuditLog.builder()
                        .actionType("STAGE_CHANGED")
                        .entityType("APPLICATION")
                        .entityId(application.getId())
                        .userId(manager.getId())
                        .userName(manager.getEmail())
                        .description("Moved to " + currentStage.getName())
                        .timestamp(appliedAt.plus(1, ChronoUnit.DAYS))
                        .build();
                auditLogRepository.save(auditStage);
                auditCount++;
            }

            // Notifications
            if (notifCount < 60) {
                Notification notif = Notification.builder()
                        .user(manager)
                        .message("New application from " + fn + " " + ln + " for " + job.getTitle())
                        .referenceId(application.getId())
                        .referenceType("APPLICATION")
                        .isRead(random.nextBoolean())
                        .createdAt(appliedAt)
                        .build();
                notificationRepository.save(notif);
                notifCount++;
                
                if (stageIdx >= 2) {
                    Notification intNotif = Notification.builder()
                            .user(manager)
                            .message("Interview scheduled with " + fn + " " + ln)
                            .referenceId(application.getId())
                            .referenceType("INTERVIEW")
                            .isRead(random.nextBoolean())
                            .createdAt(appliedAt.plus(2, ChronoUnit.DAYS))
                            .build();
                    notificationRepository.save(intNotif);
                    notifCount++;
                }
            }
        }

        log.info("DemoDataSeeder completed successfully. Seeded " + jobs.size() + " Jobs, " + totalCandidates + " Candidates/Applications, and generated robust timeline, audit, and notification history.");
    }
}
