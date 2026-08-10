package com.quizapp.dto;

import jakarta.validation.constraints.NotNull;
import java.util.List;
import lombok.Data;

@Data
public class SubmitAnswerRequest {
  @NotNull(message = "Question id is required") private Long questionId;

  private Long answerOptionId;

  private List<Long> answerOptionIds;

  private Long participantId;
}
