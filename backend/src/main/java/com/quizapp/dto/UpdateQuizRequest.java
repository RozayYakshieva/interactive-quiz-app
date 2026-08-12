package com.quizapp.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import lombok.Data;

@Data
public class UpdateQuizRequest {
  @NotBlank(message = "Quiz title is required")
  private String title;

  private String description;

  @Positive(message = "Time must be greater than 0") private Integer timePerQuestion;
}
