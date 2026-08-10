package com.quizapp.service;

import com.quizapp.dto.*;
import com.quizapp.entity.AnswerOption;
import com.quizapp.entity.GameSession;
import com.quizapp.entity.Question;
import com.quizapp.entity.Quiz;
import com.quizapp.entity.User;
import com.quizapp.enums.QuizStatus;
import com.quizapp.enums.SessionStatus;
import com.quizapp.exception.ResourceNotFoundException;
import com.quizapp.repository.GameSessionRepository;
import com.quizapp.repository.QuestionsRepository;
import com.quizapp.repository.QuizRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class QuizService {

  private final QuizRepository quizRepository;
  private final GameSessionRepository sessionRepository;
  private final QuestionsRepository questionsRepository;
  private final SessionService sessionService;

  @Transactional
  public QuizResponse createQuiz(CreateQuizRequest request, User organizer) {

    Quiz quiz = new Quiz();
    quiz.setTitle(request.getTitle());
    quiz.setDescription(request.getDescription());
    quiz.setTimePerQuestion(request.getTimePerQuestion());
    quiz.setStatus(QuizStatus.DRAFT);
    quiz.setOrganizer(organizer);

    for (CreateQuestionRequest q : request.getQuestions()) {

      Question question = new Question();
      question.setText(q.getText());
      question.setType(q.getType());
      question.setImageUrl(q.getImageUrl());
      question.setQuiz(quiz);

      for (AnswerOptionRequest o : q.getOptions()) {

        AnswerOption option = new AnswerOption();
        option.setText(o.getText());
        option.setIsCorrect(o.getIsCorrect());
        option.setQuestion(question);

        question.getAnswerOptions().add(option);
      }

      quiz.getQuestions().add(question);
    }

    quizRepository.save(quiz);

    return toResponse(quiz);
  }

  public QuizResponse toResponse(Quiz quiz) {
    return QuizResponse.builder()
        .id(quiz.getId())
        .title(quiz.getTitle())
        .description(quiz.getDescription())
        .timePerQuestion(quiz.getTimePerQuestion())
        .status(quiz.getStatus().name())
        .createdAt(quiz.getCreatedAt())
        .organizerId(quiz.getOrganizer().getId())
        .organizerName(quiz.getOrganizer().getUsername())
        .build();
  }

  public List<QuizResponse> getQuizzesByOrganizer(Long organizerId) {
    return quizRepository.findByOrganizerId(organizerId).stream().map(this::toResponse).toList();
  }

  @Transactional
  public QuizResponse updateQuiz(Long quizId, UpdateQuizRequest request, User organizer) {
    Quiz quiz =
        quizRepository
            .findById(quizId)
            .orElseThrow(() -> new ResourceNotFoundException("Quiz not found with id: " + quizId));
    if (!quiz.getOrganizer().getId().equals(organizer.getId())) {
      throw new IllegalArgumentException("You can only update your own quizzes");
    }
    quiz.setTitle(request.getTitle());
    quiz.setDescription(request.getDescription());
    quiz.setTimePerQuestion(request.getTimePerQuestion());

    quizRepository.save(quiz);
    return toResponse(quiz);
  }

  @Transactional
  public void deleteQuiz(Long quizId, User organizer) {
    Quiz quiz =
        quizRepository
            .findById(quizId)
            .orElseThrow(() -> new ResourceNotFoundException("Quiz not found with id: " + quizId));
    if (!quiz.getOrganizer().getId().equals(organizer.getId())) {
      throw new IllegalArgumentException("You can only delete your own quizzes");
    }
    quizRepository.delete(quiz);
  }

  @Transactional(readOnly = true)
  public QuizResponse getQuizWithQuestions(Long quizId, User currentUser) {
    Quiz quiz =
        quizRepository
            .findById(quizId)
            .orElseThrow(() -> new ResourceNotFoundException("Quiz not found"));
    if (!quiz.getOrganizer().getId().equals(currentUser.getId())) {
      throw new IllegalArgumentException("Access denied");
    }
    return toResponse(quiz);
  }

  @Transactional
  public GameSessionResponse startSession(Long quizId, User organizer) {
    Quiz quiz =
        quizRepository
            .findById(quizId)
            .orElseThrow(() -> new ResourceNotFoundException("Quiz not found with id: " + quizId));

    if (!quiz.getOrganizer().getId().equals(organizer.getId())) {
      throw new IllegalArgumentException("You can only start sessions for your own quizzes");
    }

    long questionCount = questionsRepository.countByQuizId(quizId);
    if (questionCount == 0) {
      throw new IllegalArgumentException("Quiz is not ready to start: add at least one question");
    }

    GameSession session =
        GameSession.builder()
            .quiz(quiz)
            .code(sessionService.generateUniqueCode())
            .status(SessionStatus.WAITING)
            .currentQuestionIndex(0)
            .build();

    sessionRepository.save(session);
    return sessionService.toGameSessionResponse(session);
  }
}
