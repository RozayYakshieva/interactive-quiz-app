package com.quizapp.controller;

import com.quizapp.dto.AuthResponse;
import com.quizapp.dto.ChangePasswordRequest;
import com.quizapp.dto.LoginRequest;
import com.quizapp.dto.RegisterRequest;
import com.quizapp.dto.ResetPasswordRequest;
import com.quizapp.dto.UpdateProfileRequest;
import com.quizapp.dto.UserProfileResponse;
import com.quizapp.security.AuthUtils;
import com.quizapp.service.AuthService;
import jakarta.validation.Valid;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

  private final AuthService authService;

  @PostMapping("/register")
  public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
    AuthResponse response = authService.register(request);
    return ResponseEntity.status(HttpStatus.CREATED).body(response);
  }

  @PostMapping("/login")
  public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
    AuthResponse response = authService.login(request);
    return ResponseEntity.ok(response);
  }

  @GetMapping("/me")
  public ResponseEntity<UserProfileResponse> getProfile(Authentication authentication) {
    return ResponseEntity.ok(authService.getProfile(AuthUtils.getCurrentUser(authentication)));
  }

  @PutMapping("/profile")
  public ResponseEntity<UserProfileResponse> updateProfile(
      @Valid @RequestBody UpdateProfileRequest request, Authentication authentication) {
    return ResponseEntity.ok(
        authService.updateProfile(AuthUtils.getCurrentUser(authentication), request));
  }

  @PutMapping("/password")
  public ResponseEntity<Void> changePassword(
      @Valid @RequestBody ChangePasswordRequest request, Authentication authentication) {
    authService.changePassword(AuthUtils.getCurrentUser(authentication), request);
    return ResponseEntity.noContent().build();
  }

  @PostMapping("/reset-password")
  public ResponseEntity<Map<String, String>> resetPassword(
      @Valid @RequestBody ResetPasswordRequest request) {
    authService.resetPassword(request);
    return ResponseEntity.ok(
        Map.of("message", "Password has been reset. You can now log in with your new password."));
  }
}
