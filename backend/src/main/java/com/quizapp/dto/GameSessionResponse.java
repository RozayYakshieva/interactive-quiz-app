package com.quizapp.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GameSessionResponse {
  private Long id;
  private String code;
  private String status;
  private String quizTitle;
  private Long organizerId;
}
