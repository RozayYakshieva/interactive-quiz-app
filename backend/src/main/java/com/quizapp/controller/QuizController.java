package com.quizapp.controller;

import com.quizapp.dto.CreateQuizRequest;
import com.quizapp.dto.GameSessionResponse;
import com.quizapp.dto.QuizResponse;
import com.quizapp.dto.UpdateQuizRequest;
import com.quizapp.entity.User;
import com.quizapp.security.AuthUtils;
import com.quizapp.service.QuizService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/quizzes")
@RequiredArgsConstructor
public class QuizController {

  private final QuizService quizService;

  @GetMapping
  public ResponseEntity<List<QuizResponse>> listQuizzes(Authentication authentication) {

    return ResponseEntity.ok(
        quizService.getQuizzesByOrganizer(AuthUtils.getCurrentUser(authentication).getId()));
  }

  @GetMapping("/{id}")
  public ResponseEntity<QuizResponse> getQuizById(
      @PathVariable Long id, Authentication authentication) {
    User organizer = AuthUtils.getCurrentUser(authentication);
    return ResponseEntity.ok((quizService.getQuizWithQuestions(id, organizer)));
  }

  @PostMapping
  public ResponseEntity<QuizResponse> createQuiz(
      @Valid @RequestBody CreateQuizRequest request, Authentication authentication) {

    return ResponseEntity.status(HttpStatus.CREATED)
        .body(quizService.createQuiz(request, AuthUtils.getCurrentUser(authentication)));
  }

  @PutMapping("/{id}")
  public ResponseEntity<QuizResponse> updateQuiz(
      @PathVariable Long id,
      @Valid @RequestBody UpdateQuizRequest request,
      Authentication authentication) {

    return ResponseEntity.ok(
        quizService.updateQuiz(id, request, AuthUtils.getCurrentUser(authentication)));
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> deleteQuiz(@PathVariable Long id, Authentication authentication) {

    quizService.deleteQuiz(id, AuthUtils.getCurrentUser(authentication));

    return ResponseEntity.noContent().build();
  }

  @PostMapping("/{id}/start")
  public ResponseEntity<GameSessionResponse> startSession(
      @PathVariable Long id, Authentication authentication) {
    return ResponseEntity.status(HttpStatus.CREATED)
        .body(quizService.startSession(id, AuthUtils.getCurrentUser(authentication)));
  }
}
