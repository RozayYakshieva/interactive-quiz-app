package com.quizapp.dto;

import java.util.List;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ParticipantDetailsResponse {
  private Long participantId;
  private String playerName;
  private Integer score;
  private List<ParticipantAnswerResponse> answers;
}
