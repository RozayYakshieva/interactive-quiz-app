package com.quizapp.entity;

import jakarta.persistence.*;
import java.time.Instant;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(name = "user_answers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserAnswer {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "participant_id", nullable = false)
  private Participant participant;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "question_id", nullable = false)
  private Question question;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "answer_option_id", nullable = false)
  private AnswerOption answerOption;

  @Column(name = "is_correct")
  private boolean isCorrect;

  @CreationTimestamp
  @Column(name = "answered_at", nullable = false, updatable = false)
  private Instant answeredAt;
}
