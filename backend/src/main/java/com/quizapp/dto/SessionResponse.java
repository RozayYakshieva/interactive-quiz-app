package com.quizapp.dto;

import java.time.Instant;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class SessionResponse {
  private Long id;
  private Long quizId;
  private String code;
  private String status;
  private Integer currentQuestionIndex;
  private Instant startedAt;
}
