package com.quizapp.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateProfileRequest {

  @NotBlank(message = "Full name is required")
  @Size(max = 100)
  private String username;

  @NotBlank(message = "Email is required")
  @Email
  private String email;
}
