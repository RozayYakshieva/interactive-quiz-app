package com.quizapp.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.util.List;
import lombok.Data;

@Data
public class CreateQuizRequest {

  @NotBlank(message = "Название квиза не может быть пустым")
  private String title;

  private String description;

  @NotNull(message = "Время на вопрос обязательно") @Positive(message = "Время должно быть больше 0") private Integer timePerQuestion;

  @NotNull(message = "Список вопросов обязателен") @Size(min = 1, message = "Должен быть минимум один вопрос")
  private List<CreateQuestionRequest> questions;
}
