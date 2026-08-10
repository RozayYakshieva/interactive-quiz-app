package com.quizapp.service;

import com.quizapp.config.JwtService;
import com.quizapp.dto.AuthResponse;
import com.quizapp.dto.ChangePasswordRequest;
import com.quizapp.dto.LoginRequest;
import com.quizapp.dto.RegisterRequest;
import com.quizapp.dto.ResetPasswordRequest;
import com.quizapp.dto.UpdateProfileRequest;
import com.quizapp.dto.UserProfileResponse;
import com.quizapp.entity.User;
import com.quizapp.enums.UserRole;
import com.quizapp.exception.ResourceNotFoundException;
import com.quizapp.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

  private final UserRepository userRepository;
  private final PasswordEncoder passwordEncoder;
  private final JwtService jwtService;

  public AuthResponse register(RegisterRequest request) {
    if (userRepository.existsByEmail(request.getEmail())) {
      throw new IllegalArgumentException("Email already registered");
    }

    User user =
        User.builder()
            .email(request.getEmail())
            .passwordHash(passwordEncoder.encode(request.getPassword()))
            .username(request.getUsername())
            .role(UserRole.PARTICIPANT)
            .build();

    userRepository.save(user);

    String token = jwtService.generateToken(user.getId(), user.getEmail(), user.getRole().name());

    return AuthResponse.builder()
        .id(user.getId())
        .email(user.getEmail())
        .username(user.getUsername())
        .role(user.getRole().name())
        .token(token)
        .build();
  }

  public AuthResponse login(LoginRequest request) {
    User user =
        userRepository
            .findByEmail(request.getEmail())
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));

    if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
      throw new IllegalArgumentException("Invalid password");
    }

    String token = jwtService.generateToken(user.getId(), user.getEmail(), user.getRole().name());

    return AuthResponse.builder()
        .id(user.getId())
        .email(user.getEmail())
        .username(user.getUsername())
        .role(user.getRole().name())
        .token(token)
        .build();
  }

  public UserProfileResponse getProfile(User user) {
    return UserProfileResponse.builder()
        .id(user.getId())
        .username(user.getUsername())
        .email(user.getEmail())
        .role(user.getRole().name())
        .build();
  }

  @Transactional
  public UserProfileResponse updateProfile(User user, UpdateProfileRequest request) {
    if (!user.getEmail().equalsIgnoreCase(request.getEmail())
        && userRepository.existsByEmail(request.getEmail())) {
      throw new IllegalArgumentException("Email already in use");
    }

    user.setUsername(request.getUsername().trim());
    user.setEmail(request.getEmail().trim());
    userRepository.save(user);

    return getProfile(user);
  }

  @Transactional
  public void changePassword(User user, ChangePasswordRequest request) {
    if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
      throw new IllegalArgumentException("Current password is incorrect");
    }

    user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
    userRepository.save(user);
  }

  @Transactional
  public void resetPassword(ResetPasswordRequest request) {
    User user =
        userRepository
            .findByEmail(request.getEmail().trim())
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));

    user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
    userRepository.save(user);
  }
}
