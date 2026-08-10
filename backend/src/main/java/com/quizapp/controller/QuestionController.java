package com.quizapp.controller;

import com.quizapp.dto.CreateQuestionRequest;
import com.quizapp.dto.QuestionResponse;
import com.quizapp.dto.UpdateQuestionRequest;
import com.quizapp.security.AuthUtils;
import com.quizapp.service.QuestionService;
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
public class QuestionController {

  private final QuestionService questionService;

  @PostMapping("/{quizId}/questions")
  public ResponseEntity<QuestionResponse> addQuestion(
      @PathVariable Long quizId,
      @Valid @RequestBody CreateQuestionRequest request,
      Authentication authentication) {
    return ResponseEntity.status(HttpStatus.CREATED)
        .body(
            questionService.createQuestion(
                quizId, request, AuthUtils.getCurrentUser(authentication)));
  }

  @GetMapping("/{quizId}/questions")
  public ResponseEntity<List<QuestionResponse>> getQuestions(
      @PathVariable Long quizId, Authentication authentication) {
    return ResponseEntity.ok(
        questionService.getQuestionByQuizId(quizId, AuthUtils.getCurrentUser(authentication)));
  }

  @PutMapping("/{quizId}/questions/{questionId}")
  public ResponseEntity<QuestionResponse> updateQuestion(
      @PathVariable Long quizId,
      @PathVariable Long questionId,
      @Valid @RequestBody UpdateQuestionRequest request,
      Authentication authentication) {
    return ResponseEntity.ok(
        questionService.updateQuestion(
            quizId, questionId, request, AuthUtils.getCurrentUser(authentication)));
  }

  @DeleteMapping("/{quizId}/questions/{questionId}")
  public ResponseEntity<Void> deleteQuestion(
      @PathVariable Long quizId, @PathVariable Long questionId, Authentication authentication) {
    questionService.deleteQuestion(quizId, questionId, AuthUtils.getCurrentUser(authentication));
    return ResponseEntity.noContent().build();
  }
}
