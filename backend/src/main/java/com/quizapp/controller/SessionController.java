package com.quizapp.controller;

import com.quizapp.dto.*;
import com.quizapp.security.AuthUtils;
import com.quizapp.service.SessionService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/sessions")
@RequiredArgsConstructor
public class SessionController {

  private final SessionService sessionService;

  @PostMapping
  public ResponseEntity<SessionResponse> createSession(
      @Valid @RequestBody CreateSessionRequest request, Authentication authentication) {
    return ResponseEntity.status(HttpStatus.CREATED)
        .body(sessionService.createSession(request, AuthUtils.getCurrentUser(authentication)));
  }

  @PostMapping("/join")
  public ResponseEntity<ParticipantResponse> joinSession(
      @Valid @RequestBody JoinSessionRequest request, Authentication authentication) {
    return ResponseEntity.ok(
        sessionService.joinSession(request, AuthUtils.getOptionalUser(authentication)));
  }

  @PostMapping("/{id}/start")
  public ResponseEntity<SessionResponse> startSession(
      @PathVariable Long id, Authentication authentication) {
    return ResponseEntity.ok(
        sessionService.startSession(id, AuthUtils.getCurrentUser(authentication)));
  }

  @GetMapping("/history")
  public ResponseEntity<List<SessionHistoryResponse>> getSessionHistory(
      Authentication authentication) {
    return ResponseEntity.ok(
        sessionService.getSessionHistory(AuthUtils.getCurrentUser(authentication)));
  }

  @GetMapping("/{id}/current-question")
  public ResponseEntity<QuestionResponse> getCurrentQuestion(@PathVariable Long id) {
    return ResponseEntity.ok(sessionService.getCurrentQuestion(id));
  }

  @GetMapping("/{id}/current")
  public ResponseEntity<QuestionResponse> getCurrent(@PathVariable Long id) {
    return ResponseEntity.ok(sessionService.getCurrentQuestion(id));
  }

  @PostMapping("/{id}/answer")
  public ResponseEntity<AnswerResponse> submitAnswer(
      @PathVariable Long id,
      @Valid @RequestBody SubmitAnswerRequest request,
      Authentication authentication) {
    return ResponseEntity.ok(
        sessionService.submitAnswer(id, request, AuthUtils.getOptionalUser(authentication)));
  }

  @PostMapping("/{id}/next-question")
  public ResponseEntity<QuestionResponse> nextQuestion(
      @PathVariable Long id, Authentication authentication) {
    return ResponseEntity.ok(
        sessionService.nextQuestion(id, AuthUtils.getCurrentUser(authentication)));
  }

  @PostMapping("/{id}/finish")
  public ResponseEntity<SessionResponse> finishSession(
      @PathVariable Long id, Authentication authentication) {
    return ResponseEntity.ok(
        sessionService.finishSession(id, AuthUtils.getCurrentUser(authentication)));
  }

  @GetMapping("/{id}/leaderboard")
  public ResponseEntity<List<LeaderboardResponse>> getLeaderboard(@PathVariable Long id) {
    return ResponseEntity.ok(sessionService.getLeaderboard(id));
  }

  @GetMapping("/{id}/answer-progress")
  public ResponseEntity<AnswerProgressResponse> getAnswerProgress(@PathVariable Long id) {
    return ResponseEntity.ok(sessionService.getAnswerProgress(id));
  }

  @GetMapping("/{id}/participants")
  public ResponseEntity<List<ParticipantResponse>> getParticipants(@PathVariable Long id) {
    return ResponseEntity.ok(sessionService.getParticipants(id));
  }

  @GetMapping("/code/{code}")
  public ResponseEntity<GameSessionResponse> getSessionByCode(@PathVariable String code) {
    return ResponseEntity.ok(sessionService.getSessionByCode(code));
  }

  @DeleteMapping("/code/{code}")
  public ResponseEntity<Void> cancelSessionByCode(
      @PathVariable String code, Authentication authentication) {
    sessionService.cancelSessionByCode(code, AuthUtils.getCurrentUser(authentication));
    return ResponseEntity.noContent().build();
  }
}
