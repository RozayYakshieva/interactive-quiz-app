package com.quizapp.dto;

import java.time.Instant;
import java.util.List;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class QuizResponse {
  private Long id;
  private String title;
  private String description;
  private Integer timePerQuestion;
  private String status;
  private Instant createdAt;
  private Long organizerId;
  private String organizerName;
  private List<QuestionResponse> questions;
}
