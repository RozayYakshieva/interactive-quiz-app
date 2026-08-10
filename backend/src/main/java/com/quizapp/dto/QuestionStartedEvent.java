package com.quizapp.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
@AllArgsConstructor
public class QuestionStartedEvent {
  private Long questionId;
  private Integer duration;
}
