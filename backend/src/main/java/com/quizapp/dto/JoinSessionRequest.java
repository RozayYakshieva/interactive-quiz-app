package com.quizapp.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class JoinSessionRequest {

  @NotBlank(message = "Room code is required")
  private String roomCode;

  @NotBlank(message = "Nickname is required")
  private String nickname;
}
