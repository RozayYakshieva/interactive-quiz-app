package com.quizapp.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(name = "participants")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Participant {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "session_id", nullable = false)
  private GameSession session;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "user_id")
  private User user;

  @Column(nullable = false, length = 100)
  private String nickname;

  @Column(nullable = false)
  @Builder.Default
  private Integer score = 0;

  @CreationTimestamp
  @Column(name = "joined_at", nullable = false, updatable = false)
  private Instant joinedAt;

  @OneToMany(mappedBy = "participant", cascade = CascadeType.ALL, orphanRemoval = true)
  @Builder.Default
  private List<UserAnswer> userAnswers = new ArrayList<>();
}
