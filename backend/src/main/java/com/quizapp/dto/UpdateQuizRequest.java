package com.quizapp.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import lombok.Data;

@Data
public class UpdateQuizRequest {
  @NotBlank(message = "Название квиза не может быть пустым")
  private String title;

  private String description;

  @Positive(message = "Время должно быть больше 0") private Integer timePerQuestion;
}
