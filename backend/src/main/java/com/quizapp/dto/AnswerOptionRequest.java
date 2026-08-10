package com.quizapp.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AnswerOptionRequest {
  private Long id;

  @NotBlank(message = "Текст варианта ответа не может быть пустым")
  private String text;

  private Boolean isCorrect;
}
