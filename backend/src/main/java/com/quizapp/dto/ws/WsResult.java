package com.quizapp.dto.ws;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class WsResult {
  private String username;
  private Boolean isCorrect;
  private Integer score;
  private Integer totalAnswered;
}
