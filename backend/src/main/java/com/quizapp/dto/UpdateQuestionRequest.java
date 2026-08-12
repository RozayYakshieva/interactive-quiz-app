package com.quizapp.dto;

import com.quizapp.enums.QuestionType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;
import lombok.Data;

@Data
public class UpdateQuestionRequest {

  @NotBlank(message = "Question text is required")
  private String text;

  @NotNull(message = "Question type is required") private QuestionType type;

  @NotNull(message = "Answer options are required") @Size(min = 2, message = "At least two answer options are required")
  private List<AnswerOptionRequest> options;

  private String imageUrl;
}
