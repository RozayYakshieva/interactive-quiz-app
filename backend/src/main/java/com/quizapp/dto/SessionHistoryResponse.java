package com.quizapp.dto;

import java.time.Instant;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class SessionHistoryResponse {
  private Long id;
  private String quizTitle;
  private String code;
  private String status;
  private Instant startedAt;
  private int playersCount;
}
