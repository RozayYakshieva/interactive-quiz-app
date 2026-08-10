package com.quizapp.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ParticipantResponse {
  private Long id;
  private Long sessionId;
  private Long userId;
  private String userName;
  private Integer score;
  private String nickname;
}
