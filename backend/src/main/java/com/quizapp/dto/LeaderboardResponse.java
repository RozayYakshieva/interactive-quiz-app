package com.quizapp.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class LeaderboardResponse {
  private Integer position;
  private Long participantId;
  private String userName;
  private String nickname;
  private Integer score;
}
