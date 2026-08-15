package com.quizapp.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class SessionQuestionSummary {
  private Long id;
  private String text;
  private Integer orderIndex;
}
