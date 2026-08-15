package com.quizapp.dto;

import java.time.Instant;
import java.util.List;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class SessionDetailsResponse {
  private Long id;
  private String quizTitle;
  private String code;
  private String status;
  private Instant startedAt;
  private List<SessionQuestionSummary> questions;
  private List<ParticipantDetailsResponse> participants;
}
