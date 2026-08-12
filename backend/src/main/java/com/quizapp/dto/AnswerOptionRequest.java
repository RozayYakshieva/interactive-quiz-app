package com.quizapp.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AnswerOptionRequest {
  private Long id;

  @NotBlank(message = "Answer option text is required")
  private String text;

  private Boolean isCorrect;
}
