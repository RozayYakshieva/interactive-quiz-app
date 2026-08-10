package com.quizapp.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AnswerProgressResponse {
  private Long questionId;
  private int answeredCount;
  private int totalParticipants;
}
