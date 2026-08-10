package com.quizapp.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AnswerOptionResponse {
  private Long id;
  private Boolean isCorrect;
  private String text;
}
