package com.quizapp.entity;

import com.quizapp.enums.SessionStatus;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import lombok.*;

@Entity
@Table(name = "sessions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GameSession {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "quiz_id", nullable = false)
  private Quiz quiz;

  @Column(nullable = false, unique = true, length = 8)
  private String code;

  @Column(name = "current_question_index", nullable = false)
  @Builder.Default
  private Integer currentQuestionIndex = 0;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 20)
  @Builder.Default
  private SessionStatus status = SessionStatus.WAITING;

  @Column(name = "started_at")
  private Instant startedAt;

  @Column(name = "base_points")
  private Integer basePoints;

  @OneToMany(mappedBy = "session", cascade = CascadeType.ALL, orphanRemoval = true)
  @Builder.Default
  private List<Participant> participants = new ArrayList<>();
}
