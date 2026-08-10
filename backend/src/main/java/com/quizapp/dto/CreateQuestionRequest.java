package com.quizapp.dto;

import com.quizapp.enums.QuestionType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;
import lombok.Data;

@Data
public class CreateQuestionRequest {

  @NotBlank(message = "Текст вопроса не должен быть пустым")
  private String text;

  @NotNull(message = "Тип вопроса обязателен") private QuestionType type;

  @NotNull(message = "Варианты ответов обязательны") @Size(min = 2, message = "Должно быть минимум два варианта ответов")
  private List<AnswerOptionRequest> options;

  private String imageUrl;
}
