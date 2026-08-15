package com.quizapp.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ParticipantAnswerResponse {
  private Long questionId;
  private String selectedAnswerText;
  private Boolean isCorrect;
  private Boolean answered;
}
