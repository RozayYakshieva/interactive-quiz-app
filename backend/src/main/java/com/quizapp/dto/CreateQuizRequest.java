package com.quizapp.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.util.List;
import lombok.Data;

@Data
public class CreateQuizRequest {

  @NotBlank(message = "Quiz title is required")
  private String title;

  private String description;

  @NotNull(message = "Time per question is required") @Positive(message = "Time must be greater than 0") private Integer timePerQuestion;

  @NotNull(message = "Questions list is required") @Size(min = 1, message = "At least one question is required")
  private List<CreateQuestionRequest> questions;
}
