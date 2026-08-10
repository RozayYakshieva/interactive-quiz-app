package com.quizapp.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AnswerResponse {
  private Boolean isCorrect;
  private Integer currentScore;
}
