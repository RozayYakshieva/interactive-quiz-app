package com.quizapp.service;

import com.quizapp.dto.AnswerOptionRequest;
import com.quizapp.dto.CreateQuestionRequest;
import com.quizapp.dto.CreateQuizRequest;
import com.quizapp.dto.CreateSessionRequest;
import com.quizapp.dto.GameSessionResponse;
import com.quizapp.dto.QuizResponse;
import com.quizapp.dto.SessionResponse;
import com.quizapp.dto.UpdateQuizRequest;
import com.quizapp.entity.AnswerOption;
import com.quizapp.entity.Question;
import com.quizapp.entity.Quiz;
import com.quizapp.entity.User;
import com.quizapp.enums.QuizStatus;
import com.quizapp.exception.ResourceNotFoundException;
import com.quizapp.repository.QuizRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class QuizService {

  private final QuizRepository quizRepository;
  private final SessionService sessionService;

  @Transactional
  public QuizResponse createQuiz(CreateQuizRequest request, User organizer) {
    Quiz quiz = new Quiz();
    quiz.setTitle(request.getTitle());
    quiz.setDescription(request.getDescription());
    quiz.setTimePerQuestion(request.getTimePerQuestion());
    quiz.setStatus(QuizStatus.DRAFT);
    quiz.setOrganizer(organizer);

    for (CreateQuestionRequest questionRequest : request.getQuestions()) {
      Question question = new Question();
      question.setText(questionRequest.getText());
      question.setType(questionRequest.getType());
      question.setImageUrl(questionRequest.getImageUrl());
      question.setTimeLimit(normalizeTimeLimit(questionRequest.getTimeLimit()));
      question.setQuiz(quiz);

      for (AnswerOptionRequest optionRequest : questionRequest.getOptions()) {
        AnswerOption option = new AnswerOption();
        option.setText(optionRequest.getText());
        option.setIsCorrect(optionRequest.getIsCorrect());
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

  @Transactional(readOnly = true)
  public List<QuizResponse> getQuizzesByOrganizer(Long organizerId) {
    return quizRepository.findByOrganizerId(organizerId).stream().map(this::toResponse).toList();
  }

  @Transactional
  public QuizResponse updateQuiz(Long quizId, UpdateQuizRequest request, User organizer) {
    Quiz quiz = findQuizById(quizId);
    requireOwner(quiz, organizer, "You can only update your own quizzes");

    quiz.setTitle(request.getTitle());
    quiz.setDescription(request.getDescription());
    quiz.setTimePerQuestion(request.getTimePerQuestion());
    quizRepository.save(quiz);
    return toResponse(quiz);
  }

  @Transactional
  public void deleteQuiz(Long quizId, User organizer) {
    Quiz quiz = findQuizById(quizId);
    requireOwner(quiz, organizer, "You can only delete your own quizzes");
    quizRepository.delete(quiz);
  }

  @Transactional(readOnly = true)
  public QuizResponse getQuizWithQuestions(Long quizId, User currentUser) {
    Quiz quiz =
        quizRepository
            .findById(quizId)
            .orElseThrow(() -> new ResourceNotFoundException("Quiz not found"));

    requireOwner(quiz, currentUser, "Access denied");
    return toResponse(quiz);
  }

  @Transactional
  public GameSessionResponse startSession(Long quizId, User organizer) {
    CreateSessionRequest request = new CreateSessionRequest();
    request.setQuizId(quizId);
    SessionResponse created = sessionService.createSession(request, organizer);
    return sessionService.getSessionByCode(created.getCode());
  }

  private Quiz findQuizById(Long quizId) {
    return quizRepository
        .findById(quizId)
        .orElseThrow(() -> new ResourceNotFoundException("Quiz not found with id: " + quizId));
  }

  private void requireOwner(Quiz quiz, User user, String message) {
    if (!quiz.getOrganizer().getId().equals(user.getId())) {
      throw new IllegalArgumentException(message);
    }
  }

  private Integer normalizeTimeLimit(Integer timeLimit) {
    if (timeLimit == null || timeLimit <= 0) {
      return null;
    }
    return timeLimit;
  }
}
