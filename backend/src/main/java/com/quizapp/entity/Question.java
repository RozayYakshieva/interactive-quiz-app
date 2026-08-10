package com.quizapp.entity;

import com.quizapp.enums.QuestionType;
import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;
import lombok.*;

@Entity
@Table(name = "questions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Question {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "quiz_id", nullable = false)
  private Quiz quiz;

  @Column(nullable = false, columnDefinition = "TEXT")
  private String text;

  @Column(name = "image_url", columnDefinition = "TEXT")
  private String imageUrl;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 20)
  @Builder.Default
  private QuestionType type = QuestionType.SINGLE;

  @OneToMany(mappedBy = "question", cascade = CascadeType.ALL, orphanRemoval = true)
  @Builder.Default
  private List<AnswerOption> answerOptions = new ArrayList<>();
}
