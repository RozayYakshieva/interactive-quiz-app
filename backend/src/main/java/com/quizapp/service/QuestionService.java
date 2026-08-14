package com.quizapp.service;

import com.quizapp.dto.*;
import com.quizapp.entity.AnswerOption;
import com.quizapp.entity.Question;
import com.quizapp.entity.Quiz;
import com.quizapp.entity.User;
import com.quizapp.exception.ResourceNotFoundException;
import com.quizapp.repository.QuestionsRepository;
import com.quizapp.repository.QuizRepository;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class QuestionService {

  private final QuestionsRepository questionsRepository;
  private final QuizRepository quizRepository;

  @Transactional
  public QuestionResponse createQuestion(
      Long quizId, CreateQuestionRequest request, User organizer) {
    Quiz quiz = getOwnedQuiz(quizId, organizer);

    Question question = new Question();
    question.setText(request.getText());
    question.setType(request.getType());
    question.setQuiz(quiz);
    question.setImageUrl(normalizeImageUrl(request.getImageUrl()));
    question.setTimeLimit(normalizeTimeLimit(request.getTimeLimit()));
    question.setOrderIndex(resolveOrderIndex(quizId, request.getOrderIndex()));

    if (request.getOptions() != null && !request.getOptions().isEmpty()) {
      List<AnswerOption> answerOptions =
          request.getOptions().stream()
              .map(
                  answerOptionRequest -> {
                    AnswerOption option = new AnswerOption();
                    option.setText(answerOptionRequest.getText());
                    option.setIsCorrect(Boolean.TRUE.equals(answerOptionRequest.getIsCorrect()));
                    option.setQuestion(question);
                    return option;
                  })
              .toList();

      question.setAnswerOptions(new ArrayList<>(answerOptions));
    }
    questionsRepository.save(question);
    return toResponse(question);
  }

  public QuestionResponse toResponse(Question question) {
    return QuestionResponse.builder()
        .id(question.getId())
        .quizId(question.getQuiz().getId())
        .text(question.getText())
        .type(question.getType())
        .imageUrl(question.getImageUrl())
        .timeLimit(question.getTimeLimit())
        .orderIndex(question.getOrderIndex())
        .answerOptions(
            question.getAnswerOptions().stream()
                .map(
                    answerOption ->
                        AnswerOptionResponse.builder()
                            .id(answerOption.getId())
                            .isCorrect(answerOption.getIsCorrect())
                            .text(answerOption.getText())
                            .build())
                .toList())
        .build();
  }

  @Transactional(readOnly = true)
  public List<QuestionResponse> getQuestionByQuizId(Long quizId, User organizer) {
    getOwnedQuiz(quizId, organizer);
    return questionsRepository.findByQuizIdWithOptionsOrderByOrderIndexAsc(quizId).stream()
        .map(this::toResponse)
        .toList();
  }

  @Transactional
  public QuestionResponse updateQuestion(
      Long quizId, Long questionId, UpdateQuestionRequest request, User organizer) {
    getOwnedQuiz(quizId, organizer);

    Question question =
        questionsRepository
            .findWithAnswerOptionsById(questionId)
            .orElseThrow(
                () -> new ResourceNotFoundException("Question not found with id: " + questionId));

    if (!question.getQuiz().getId().equals(quizId)) {
      throw new IllegalArgumentException("Question does not belong to this quiz");
    }

    question.setText(request.getText());
    question.setType(request.getType());
    question.setImageUrl(normalizeImageUrl(request.getImageUrl()));
    question.setTimeLimit(normalizeTimeLimit(request.getTimeLimit()));
    if (request.getOrderIndex() != null) {
      question.setOrderIndex(request.getOrderIndex());
    }

    syncAnswerOptions(question, request.getOptions());

    Question saved = questionsRepository.save(question);
    return toResponse(saved);
  }

  @Transactional
  public void deleteQuestion(Long quizId, Long questionId, User organizer) {
    getOwnedQuiz(quizId, organizer);

    Question question =
        questionsRepository
            .findById(questionId)
            .orElseThrow(
                () -> new ResourceNotFoundException("Question not found with id: " + questionId));

    if (!question.getQuiz().getId().equals(quizId)) {
      throw new IllegalArgumentException("Question does not belong to this quiz");
    }

    questionsRepository.delete(question);
  }

  private void syncAnswerOptions(Question question, List<AnswerOptionRequest> requestedOptions) {
    Set<Long> retainedOptionIds = new HashSet<>();

    for (AnswerOptionRequest optionRequest : requestedOptions) {
      if (optionRequest.getId() != null) {
        retainedOptionIds.add(optionRequest.getId());
      }
    }

    question.getAnswerOptions().removeIf(option -> !retainedOptionIds.contains(option.getId()));

    for (AnswerOptionRequest optionRequest : requestedOptions) {
      if (optionRequest.getId() != null) {
        AnswerOption existing =
            question.getAnswerOptions().stream()
                .filter(option -> option.getId().equals(optionRequest.getId()))
                .findFirst()
                .orElseThrow(
                    () ->
                        new IllegalArgumentException(
                            "Answer option not found with id: " + optionRequest.getId()));

        existing.setText(optionRequest.getText());
        existing.setIsCorrect(Boolean.TRUE.equals(optionRequest.getIsCorrect()));
      } else {
        AnswerOption option = new AnswerOption();
        option.setText(optionRequest.getText());
        option.setIsCorrect(Boolean.TRUE.equals(optionRequest.getIsCorrect()));
        option.setQuestion(question);
        question.getAnswerOptions().add(option);
      }
    }
  }

  private Quiz getOwnedQuiz(Long quizId, User organizer) {
    Quiz quiz =
        quizRepository
            .findById(quizId)
            .orElseThrow(() -> new ResourceNotFoundException("Quiz not found with id: " + quizId));

    if (!quiz.getOrganizer().getId().equals(organizer.getId())) {
      throw new IllegalArgumentException("You can only manage your own quizzes");
    }

    return quiz;
  }

  private String normalizeImageUrl(String imageUrl) {
    if (imageUrl == null || imageUrl.isBlank()) {
      return null;
    }
    return imageUrl.trim();
  }

  private Integer normalizeTimeLimit(Integer timeLimit) {
    if (timeLimit == null || timeLimit <= 0) {
      return null;
    }
    return timeLimit;
  }

  private Integer resolveOrderIndex(Long quizId, Integer requestedOrderIndex) {
    if (requestedOrderIndex != null) {
      return requestedOrderIndex;
    }
    Integer maxOrderIndex = questionsRepository.findMaxOrderIndexByQuizId(quizId);
    return maxOrderIndex == null ? 0 : maxOrderIndex + 1;
  }
}
