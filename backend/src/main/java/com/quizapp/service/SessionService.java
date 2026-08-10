package com.quizapp.service;

import com.quizapp.dto.*;
import com.quizapp.entity.*;
import com.quizapp.enums.QuestionType;
import com.quizapp.enums.SessionStatus;
import com.quizapp.exception.ResourceNotFoundException;
import com.quizapp.repository.*;
import java.security.SecureRandom;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class SessionService {
  private static final String CODE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
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
    if (!quiz.getOrganizer().getId().equals(organizer.getId())) {
      throw new IllegalArgumentException("You can only start sessions for your own quizzes");
    }

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
    GameSession session =
        sessionRepository
            .findByCode(request.getRoomCode())
            .orElseThrow(
                () ->
                    new ResourceNotFoundException(
                        "Session not found with code: " + request.getRoomCode()));

    if (session.getStatus() != SessionStatus.WAITING) {
      throw new IllegalArgumentException("Session is not accepting participants");
    }

    if (user != null) {
      boolean alreadyJoined =
          participantRepository.existsBySessionIdAndUserId(session.getId(), user.getId());
      if (alreadyJoined) {
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

  String generateUniqueCode() {
    String code;
    do {
      StringBuilder sb = new StringBuilder(6);
      for (int i = 0; i < 6; i++) {
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
        .userName(
            participant.getUser() != null
                ? participant.getUser().getUsername()
                : participant.getNickname())
        .nickname(participant.getNickname())
        .score(participant.getScore())
        .build();
  }

  @Transactional(readOnly = true)
  public GameSessionResponse getSessionByCode(String code) {
    GameSession session =
        sessionRepository
            .findByCode(code)
            .orElseThrow(
                () -> new ResourceNotFoundException("Session not found with code: " + code));
    return toGameSessionResponse(session);
  }

  @Transactional
  public void cancelSessionByCode(String code, User organizer) {
    GameSession session =
        sessionRepository
            .findByCode(code)
            .orElseThrow(
                () -> new ResourceNotFoundException("Session not found with code: " + code));

    if (!session.getQuiz().getOrganizer().getId().equals(organizer.getId())) {
      throw new IllegalArgumentException("Only organizer can cancel this session");
    }

    if (session.getStatus() != SessionStatus.WAITING) {
      throw new IllegalArgumentException("Only waiting sessions can be cancelled");
    }

    sessionRepository.deleteByCode(code);
  }

  @Transactional
  public SessionResponse startSession(Long sessionId, User organizer) {
    GameSession session =
        sessionRepository
            .findById(sessionId)
            .orElseThrow(
                () -> new ResourceNotFoundException("Session not found wirh id: " + sessionId));

    if (!session.getQuiz().getOrganizer().getId().equals(organizer.getId())) {
      throw new IllegalArgumentException("Only organizer can start session");
    }

    if (session.getStatus() != SessionStatus.WAITING) {
      throw new IllegalArgumentException("Session is not in WAITING status");
    }

    session.setStatus(SessionStatus.RUNNING);
    session.setStartedAt(java.time.Instant.now());
    sessionRepository.save(session);
    List<Question> questions = questionsRepository.findByQuizId(session.getQuiz().getId());
    if (!questions.isEmpty()) {
      webSocketService.sendQuestion(session.getId(), questions.get(0));

      webSocketService.startQuestion(session.getId(), questions.get(0).getId());
    }
    webSocketService.sendEvent(session.getId(), "GAME_STARTED", "Игра началась!");
    return toResponse(session);
  }

  public QuestionResponse getCurrentQuestion(Long sessionId) {
    GameSession session =
        sessionRepository
            .findById(sessionId)
            .orElseThrow(
                () -> new ResourceNotFoundException("Session not found with id: " + sessionId));

    if (session.getStatus() != SessionStatus.RUNNING) {
      throw new IllegalArgumentException("Session is not running");
    }
    List<Question> questions = questionsRepository.findByQuizId(session.getQuiz().getId());
    int index = session.getCurrentQuestionIndex();

    if (index >= questions.size()) {
      throw new IllegalArgumentException("No more questions");
    }
    return questionService.toResponse(questions.get(index));
  }

  @Transactional
  public AnswerResponse submitAnswer(Long sessionId, SubmitAnswerRequest request, User user) {

    GameSession session =
        sessionRepository
            .findById(sessionId)
            .orElseThrow(
                () -> new ResourceNotFoundException("Session not found with id: " + sessionId));

    if (session.getStatus() != SessionStatus.RUNNING) {
      throw new IllegalArgumentException("Session is not running");
    }

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
      participant.setScore(participant.getScore() + 10);
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

    String displayName =
        participant.getUser() != null
            ? participant.getUser().getUsername()
            : participant.getNickname();

    webSocketService.sendResult(
        sessionId, displayName, isCorrect, participant.getScore(), totalAnswered);

    return AnswerResponse.builder()
        .isCorrect(isCorrect)
        .currentScore(participant.getScore())
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

  @Transactional(readOnly = true)
  public AnswerProgressResponse getAnswerProgress(Long sessionId) {
    GameSession session =
        sessionRepository
            .findById(sessionId)
            .orElseThrow(
                () -> new ResourceNotFoundException("Session not found with id: " + sessionId));

    if (session.getStatus() != SessionStatus.RUNNING) {
      throw new IllegalArgumentException("Session is not running");
    }

    List<Question> questions = questionsRepository.findByQuizId(session.getQuiz().getId());
    int index = session.getCurrentQuestionIndex();

    if (index >= questions.size()) {
      throw new IllegalArgumentException("No active question");
    }

    Question currentQuestion = questions.get(index);
    int answeredCount =
        (int)
            userAnswerRepository.countDistinctParticipantsBySessionIdAndQuestionId(
                sessionId, currentQuestion.getId());
    int totalParticipants = participantRepository.findBySessionId(sessionId).size();

    return AnswerProgressResponse.builder()
        .questionId(currentQuestion.getId())
        .answeredCount(answeredCount)
        .totalParticipants(totalParticipants)
        .build();
  }

  @Transactional
  public QuestionResponse nextQuestion(Long sessionId, User organizer) {
    GameSession session =
        sessionRepository
            .findById(sessionId)
            .orElseThrow(
                () -> new ResourceNotFoundException("Session not found with id: " + sessionId));

    if (!session.getQuiz().getOrganizer().getId().equals(organizer.getId())) {
      throw new IllegalArgumentException("Only organizer can change questions");
    }

    if (session.getStatus() != SessionStatus.RUNNING) {
      throw new IllegalArgumentException("Session is not running");
    }
    List<Question> questions = questionsRepository.findByQuizId(session.getQuiz().getId());
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
    webSocketService.startQuestion(session.getId(), question.getId());

    return questionService.toResponse(question);
  }

  @Transactional
  public SessionResponse finishSession(Long sessionId, User organizer) {
    GameSession session =
        sessionRepository
            .findById(sessionId)
            .orElseThrow(
                () -> new ResourceNotFoundException("Session not found with id: " + sessionId));

    if (!session.getQuiz().getOrganizer().getId().equals(organizer.getId())) {
      throw new IllegalArgumentException("Only organizer can finish the session");
    }
    session.setStatus(SessionStatus.FINISHED);
    sessionRepository.save(session);
    webSocketService.sendEvent(sessionId, "GAME_FINISHED", "Game finished");
    return toResponse(session);
  }

  public List<LeaderboardResponse> getLeaderboard(Long sessionId) {
    GameSession session =
        sessionRepository
            .findById(sessionId)
            .orElseThrow(
                () -> new ResourceNotFoundException("Session not found with id: " + sessionId));

    List<Participant> participants =
        participantRepository.findBySessionIdOrderByScoreDesc(session.getId());

    List<LeaderboardResponse> leaderboard = new java.util.ArrayList<>();
    for (int i = 0; i < participants.size(); i++) {
      Participant participant = participants.get(i);
      leaderboard.add(
          LeaderboardResponse.builder()
              .position(i + 1)
              .participantId(participant.getId())
              .userName(
                  participant.getUser() != null
                      ? participant.getUser().getUsername()
                      : participant.getNickname())
              .nickname(participant.getNickname())
              .score(participant.getScore())
              .build());
    }
    return leaderboard;
  }

  public List<ParticipantResponse> getParticipants(Long sessionId) {
    GameSession session =
        sessionRepository
            .findById(sessionId)
            .orElseThrow(
                () -> new ResourceNotFoundException("Session not found with id: " + sessionId));

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

  private SessionHistoryResponse toHistoryResponse(GameSession session) {
    int playersCount = participantRepository.findBySessionId(session.getId()).size();

    return SessionHistoryResponse.builder()
        .id(session.getId())
        .quizTitle(session.getQuiz().getTitle())
        .code(session.getCode())
        .status(session.getStatus().name())
        .startedAt(session.getStartedAt())
        .playersCount(playersCount)
        .build();
  }
}
