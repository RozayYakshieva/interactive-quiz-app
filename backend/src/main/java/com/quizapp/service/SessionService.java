package com.quizapp.service;

import com.quizapp.dto.*;
import com.quizapp.entity.*;
import com.quizapp.enums.QuestionType;
import com.quizapp.enums.SessionStatus;
import com.quizapp.exception.ResourceNotFoundException;
import com.quizapp.repository.*;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class SessionService {
  private static final String CODE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  private static final int CODE_LENGTH = 6;
  private static final int CORRECT_ANSWER_POINTS = 10;
  private static final SecureRandom RANDOM = new SecureRandom();

  private final GameSessionRepository sessionRepository;
  private final QuizRepository quizRepository;
  private final ParticipantRepository participantRepository;
  private final QuestionsRepository questionsRepository;
  private final QuestionService questionService;
  private final AnswerOptionRepository answerOptionRepository;
  private final UserAnswerRepository userAnswerRepository;
  private final WebSocketService webSocketService;

  @Transactional
  public SessionResponse createSession(CreateSessionRequest request, User organizer) {
    Quiz quiz =
        quizRepository
            .findById(request.getQuizId())
            .orElseThrow(
                () ->
                    new ResourceNotFoundException(
                        "Quiz not found with id: " + request.getQuizId()));

    requireOrganizer(quiz, organizer, "You can only start sessions for your own quizzes");

    long questionCount = questionsRepository.countByQuizId(request.getQuizId());
    if (questionCount == 0) {
      throw new IllegalArgumentException("Quiz is not ready to start: add at least one question");
    }

    GameSession session =
        GameSession.builder()
            .quiz(quiz)
            .code(generateUniqueCode())
            .status(SessionStatus.WAITING)
            .currentQuestionIndex(0)
            .build();

    sessionRepository.save(session);
    return toResponse(session);
  }

  @Transactional
  public ParticipantResponse joinSession(JoinSessionRequest request, User user) {
    GameSession session = findSessionByCode(request.getRoomCode());

    if (session.getStatus() != SessionStatus.WAITING) {
      throw new IllegalArgumentException("Session is not accepting participants");
    }

    if (user != null) {
      if (participantRepository.existsBySessionIdAndUserId(session.getId(), user.getId())) {
        throw new IllegalArgumentException("You already joined this session");
      }
    } else if (participantRepository.existsBySessionIdAndNickname(
        session.getId(), request.getNickname())) {
      throw new IllegalArgumentException("Nickname already taken in this session");
    }

    Participant participant =
        Participant.builder()
            .session(session)
            .user(user)
            .nickname(request.getNickname())
            .score(0)
            .build();

    participantRepository.save(participant);
    return toParticipantResponse(participant);
  }

  private String generateUniqueCode() {
    String code;
    do {
      StringBuilder sb = new StringBuilder(CODE_LENGTH);
      for (int i = 0; i < CODE_LENGTH; i++) {
        sb.append(CODE_CHARS.charAt(RANDOM.nextInt(CODE_CHARS.length())));
      }
      code = sb.toString();
    } while (sessionRepository.findByCode(code).isPresent());
    return code;
  }

  public SessionResponse toResponse(GameSession session) {
    return SessionResponse.builder()
        .id(session.getId())
        .quizId(session.getQuiz().getId())
        .code(session.getCode())
        .status(session.getStatus().name())
        .currentQuestionIndex(session.getCurrentQuestionIndex())
        .startedAt(session.getStartedAt())
        .build();
  }

  public GameSessionResponse toGameSessionResponse(GameSession session) {
    return GameSessionResponse.builder()
        .id(session.getId())
        .code(session.getCode())
        .status(session.getStatus().name())
        .quizTitle(session.getQuiz().getTitle())
        .organizerId(session.getQuiz().getOrganizer().getId())
        .build();
  }

  public ParticipantResponse toParticipantResponse(Participant participant) {
    return ParticipantResponse.builder()
        .id(participant.getId())
        .sessionId(participant.getSession().getId())
        .userId(participant.getUser() != null ? participant.getUser().getId() : null)
        .userName(resolveDisplayName(participant))
        .nickname(participant.getNickname())
        .score(participant.getScore())
        .build();
  }

  @Transactional(readOnly = true)
  public GameSessionResponse getSessionByCode(String code) {
    return toGameSessionResponse(findSessionByCode(code));
  }

  @Transactional
  public void cancelSessionByCode(String code, User organizer) {
    GameSession session = findSessionByCode(code);
    requireOrganizer(session, organizer, "Only organizer can cancel this session");

    if (session.getStatus() != SessionStatus.WAITING) {
      throw new IllegalArgumentException("Only waiting sessions can be cancelled");
    }

    sessionRepository.deleteByCode(code);
  }

  @Transactional
  public SessionResponse startSession(Long sessionId, User organizer) {
    GameSession session = findSessionById(sessionId);
    requireOrganizer(session, organizer, "Only organizer can start session");

    if (session.getStatus() != SessionStatus.WAITING) {
      throw new IllegalArgumentException("Session is not in WAITING status");
    }

    session.setStatus(SessionStatus.RUNNING);
    session.setStartedAt(Instant.now());
    sessionRepository.save(session);

    List<Question> questions = questionsRepository.findByQuizIdOrderByOrderIndexAsc(session.getQuiz().getId());
    if (!questions.isEmpty()) {
      Question firstQuestion = questions.get(0);
      webSocketService.sendQuestion(session.getId(), firstQuestion);
      webSocketService.startQuestion(session.getId(), firstQuestion);
    }

    webSocketService.sendEvent(session.getId(), "GAME_STARTED", "Game started!");
    return toResponse(session);
  }

  @Transactional(readOnly = true)
  public QuestionResponse getCurrentQuestion(Long sessionId) {
    GameSession session = findRunningSession(sessionId);
    Question question = getCurrentQuestionEntity(session, "No more questions");
    return questionService.toResponse(question);
  }

  @Transactional
  public AnswerResponse submitAnswer(Long sessionId, SubmitAnswerRequest request, User user) {
    findRunningSession(sessionId);
    Participant participant = resolveParticipant(sessionId, request.getParticipantId(), user);

    Question question =
        questionsRepository
            .findById(request.getQuestionId())
            .orElseThrow(() -> new ResourceNotFoundException("Question not found"));

    if (userAnswerRepository.existsByParticipant_IdAndQuestion_Id(
        participant.getId(), request.getQuestionId())) {
      throw new IllegalArgumentException("You already answered this question");
    }

    List<Long> selectedOptionIds = resolveSelectedOptionIds(request);
    if (selectedOptionIds.isEmpty()) {
      throw new IllegalArgumentException("Select at least one answer option");
    }

    List<AnswerOption> selectedOptions =
        selectedOptionIds.stream()
            .map(
                optionId ->
                    answerOptionRepository
                        .findById(optionId)
                        .orElseThrow(
                            () -> new ResourceNotFoundException("Answer Option not found")))
            .toList();

    for (AnswerOption answerOption : selectedOptions) {
      if (!answerOption.getQuestion().getId().equals(request.getQuestionId())) {
        throw new IllegalArgumentException("Answer option does not belong to this question");
      }
    }

    Set<Long> selectedIds = new HashSet<>(selectedOptionIds);
    Set<Long> correctIds =
        question.getAnswerOptions().stream()
            .filter(option -> Boolean.TRUE.equals(option.getIsCorrect()))
            .map(AnswerOption::getId)
            .collect(Collectors.toSet());

    boolean isCorrect;
    if (question.getType() == QuestionType.MULTIPLE) {
      isCorrect = selectedIds.equals(correctIds);
    } else {
      if (selectedIds.size() != 1) {
        throw new IllegalArgumentException("Single choice question accepts one answer only");
      }
      isCorrect = correctIds.contains(selectedIds.iterator().next());
    }

    if (isCorrect) {
      participant.setScore(participant.getScore() + CORRECT_ANSWER_POINTS);
      participantRepository.save(participant);
    }

    for (AnswerOption answerOption : selectedOptions) {
      UserAnswer userAnswer =
          UserAnswer.builder()
              .participant(participant)
              .question(question)
              .answerOption(answerOption)
              .isCorrect(isCorrect)
              .build();
      userAnswerRepository.save(userAnswer);
    }

    int totalAnswered =
        (int)
            userAnswerRepository.countDistinctParticipantsBySessionIdAndQuestionId(
                sessionId, request.getQuestionId());

    webSocketService.sendResult(
        sessionId,
        resolveDisplayName(participant),
        isCorrect,
        participant.getScore(),
        totalAnswered);

    return AnswerResponse.builder()
        .isCorrect(isCorrect)
        .currentScore(participant.getScore())
        .build();
  }

  @Transactional(readOnly = true)
  public AnswerProgressResponse getAnswerProgress(Long sessionId) {
    GameSession session = findRunningSession(sessionId);
    Question currentQuestion = getCurrentQuestionEntity(session, "No active question");

    int answeredCount =
        (int)
            userAnswerRepository.countDistinctParticipantsBySessionIdAndQuestionId(
                sessionId, currentQuestion.getId());
    int totalParticipants = (int) participantRepository.countBySessionId(sessionId);

    return AnswerProgressResponse.builder()
        .questionId(currentQuestion.getId())
        .answeredCount(answeredCount)
        .totalParticipants(totalParticipants)
        .build();
  }

  @Transactional
  public QuestionResponse nextQuestion(Long sessionId, User organizer) {
    GameSession session = findSessionById(sessionId);
    requireOrganizer(session, organizer, "Only organizer can change questions");

    if (session.getStatus() != SessionStatus.RUNNING) {
      throw new IllegalArgumentException("Session is not running");
    }

    List<Question> questions = questionsRepository.findByQuizIdOrderByOrderIndexAsc(session.getQuiz().getId());
    int nextIndex = session.getCurrentQuestionIndex() + 1;

    if (nextIndex >= questions.size()) {
      session.setStatus(SessionStatus.FINISHED);
      sessionRepository.save(session);
      webSocketService.sendEvent(session.getId(), "GAME_FINISHED", "Game finished");
      return null;
    }

    session.setCurrentQuestionIndex(nextIndex);
    sessionRepository.save(session);

    Question question = questions.get(nextIndex);
    webSocketService.sendQuestion(session.getId(), question);
    webSocketService.startQuestion(session.getId(), question);

    return questionService.toResponse(question);
  }

  @Transactional
  public SessionResponse finishSession(Long sessionId, User organizer) {
    GameSession session = findSessionById(sessionId);
    requireOrganizer(session, organizer, "Only organizer can finish the session");

    session.setStatus(SessionStatus.FINISHED);
    sessionRepository.save(session);
    webSocketService.sendEvent(sessionId, "GAME_FINISHED", "Game finished");
    return toResponse(session);
  }

  @Transactional(readOnly = true)
  public List<LeaderboardResponse> getLeaderboard(Long sessionId) {
    GameSession session = findSessionById(sessionId);
    List<Participant> participants =
        participantRepository.findBySessionIdOrderByScoreDesc(session.getId());

    List<LeaderboardResponse> leaderboard = new ArrayList<>();
    for (int i = 0; i < participants.size(); i++) {
      Participant participant = participants.get(i);
      leaderboard.add(
          LeaderboardResponse.builder()
              .position(i + 1)
              .participantId(participant.getId())
              .userName(resolveDisplayName(participant))
              .nickname(participant.getNickname())
              .score(participant.getScore())
              .build());
    }
    return leaderboard;
  }

  @Transactional(readOnly = true)
  public List<ParticipantResponse> getParticipants(Long sessionId) {
    GameSession session = findSessionById(sessionId);
    return participantRepository.findBySessionId(session.getId()).stream()
        .map(this::toParticipantResponse)
        .toList();
  }

  @Transactional(readOnly = true)
  public List<SessionHistoryResponse> getSessionHistory(User organizer) {
    return sessionRepository
        .findFinishedByOrganizerId(organizer.getId(), SessionStatus.FINISHED)
        .stream()
        .map(this::toHistoryResponse)
        .toList();
  }

  @Transactional(readOnly = true)
  public SessionDetailsResponse getSessionDetails(Long sessionId, User organizer) {
    GameSession session = findSessionById(sessionId);
    requireOrganizer(session, organizer, "Only organizer can view session details");

    List<Question> questions =
        questionsRepository.findByQuizIdOrderByOrderIndexAsc(session.getQuiz().getId());
    List<Participant> participants =
        participantRepository.findBySessionIdWithUserOrderByScoreDesc(session.getId());
    List<UserAnswer> userAnswers = userAnswerRepository.findBySessionIdWithOptions(sessionId);

    Map<Long, Map<Long, List<UserAnswer>>> answersByParticipantAndQuestion = new HashMap<>();
    for (UserAnswer userAnswer : userAnswers) {
      answersByParticipantAndQuestion
          .computeIfAbsent(userAnswer.getParticipant().getId(), key -> new HashMap<>())
          .computeIfAbsent(userAnswer.getQuestion().getId(), key -> new ArrayList<>())
          .add(userAnswer);
    }

    List<SessionQuestionSummary> questionSummaries =
        questions.stream()
            .map(
                question ->
                    SessionQuestionSummary.builder()
                        .id(question.getId())
                        .text(question.getText())
                        .orderIndex(question.getOrderIndex())
                        .build())
            .toList();

    List<ParticipantDetailsResponse> participantDetails =
        participants.stream()
            .map(
                participant ->
                    toParticipantDetails(
                        participant,
                        questions,
                        answersByParticipantAndQuestion.getOrDefault(
                            participant.getId(), Map.of())))
            .toList();

    return SessionDetailsResponse.builder()
        .id(session.getId())
        .quizTitle(session.getQuiz().getTitle())
        .code(session.getCode())
        .status(session.getStatus().name())
        .startedAt(session.getStartedAt())
        .questions(questionSummaries)
        .participants(participantDetails)
        .build();
  }

  private ParticipantDetailsResponse toParticipantDetails(
      Participant participant,
      List<Question> questions,
      Map<Long, List<UserAnswer>> answersByQuestion) {
    List<ParticipantAnswerResponse> answers =
        questions.stream()
            .map(question -> toParticipantAnswer(question, answersByQuestion.get(question.getId())))
            .toList();

    return ParticipantDetailsResponse.builder()
        .participantId(participant.getId())
        .playerName(resolveDisplayName(participant))
        .score(participant.getScore())
        .answers(answers)
        .build();
  }

  private ParticipantAnswerResponse toParticipantAnswer(
      Question question, List<UserAnswer> selectedAnswers) {
    if (selectedAnswers == null || selectedAnswers.isEmpty()) {
      return ParticipantAnswerResponse.builder()
          .questionId(question.getId())
          .selectedAnswerText(null)
          .isCorrect(false)
          .answered(false)
          .build();
    }

    String selectedText =
        selectedAnswers.stream()
            .map(UserAnswer::getAnswerOption)
            .map(AnswerOption::getText)
            .collect(Collectors.joining(", "));

    return ParticipantAnswerResponse.builder()
        .questionId(question.getId())
        .selectedAnswerText(selectedText)
        .isCorrect(selectedAnswers.get(0).isCorrect())
        .answered(true)
        .build();
  }

  private SessionHistoryResponse toHistoryResponse(GameSession session) {
    int playersCount = (int) participantRepository.countBySessionId(session.getId());

    return SessionHistoryResponse.builder()
        .id(session.getId())
        .quizTitle(session.getQuiz().getTitle())
        .code(session.getCode())
        .status(session.getStatus().name())
        .startedAt(session.getStartedAt())
        .playersCount(playersCount)
        .build();
  }

  private List<Long> resolveSelectedOptionIds(SubmitAnswerRequest request) {
    if (request.getAnswerOptionIds() != null && !request.getAnswerOptionIds().isEmpty()) {
      return request.getAnswerOptionIds().stream().distinct().toList();
    }
    if (request.getAnswerOptionId() != null) {
      return List.of(request.getAnswerOptionId());
    }
    return List.of();
  }

  private Participant resolveParticipant(Long sessionId, Long participantId, User user) {
    if (participantId != null) {
      return participantRepository
          .findById(participantId)
          .filter(p -> p.getSession().getId().equals(sessionId))
          .orElseThrow(
              () -> new ResourceNotFoundException("Participant not found in this session"));
    }

    if (user == null) {
      throw new IllegalArgumentException("Participant id or authentication is required");
    }

    return participantRepository
        .findBySessionIdAndUserId(sessionId, user.getId())
        .orElseThrow(
            () -> new ResourceNotFoundException("You are not a participant in this session"));
  }

  private GameSession findSessionById(Long sessionId) {
    return sessionRepository
        .findById(sessionId)
        .orElseThrow(
            () -> new ResourceNotFoundException("Session not found with id: " + sessionId));
  }

  private GameSession findSessionByCode(String code) {
    return sessionRepository
        .findByCode(code)
        .orElseThrow(() -> new ResourceNotFoundException("Session not found with code: " + code));
  }

  private GameSession findRunningSession(Long sessionId) {
    GameSession session = findSessionById(sessionId);
    if (session.getStatus() != SessionStatus.RUNNING) {
      throw new IllegalArgumentException("Session is not running");
    }
    return session;
  }

  private Question getCurrentQuestionEntity(GameSession session, String emptyMessage) {
    List<Question> questions = questionsRepository.findByQuizIdOrderByOrderIndexAsc(session.getQuiz().getId());
    int index = session.getCurrentQuestionIndex();

    if (index >= questions.size()) {
      throw new IllegalArgumentException(emptyMessage);
    }

    return questions.get(index);
  }

  private void requireOrganizer(GameSession session, User organizer, String message) {
    requireOrganizer(session.getQuiz(), organizer, message);
  }

  private void requireOrganizer(Quiz quiz, User organizer, String message) {
    if (!quiz.getOrganizer().getId().equals(organizer.getId())) {
      throw new IllegalArgumentException(message);
    }
  }

  private String resolveDisplayName(Participant participant) {
    return participant.getUser() != null
        ? participant.getUser().getUsername()
        : participant.getNickname();
  }
}
