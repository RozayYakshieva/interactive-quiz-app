package com.quizapp.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreateSessionRequest {
  @NotNull(message = "Quiz id is required") private Long quizId;
}
