package com.quizapp.service;

import com.quizapp.dto.AnswerOptionResponse;
import com.quizapp.dto.QuestionStartedEvent;
import com.quizapp.dto.ws.WsGameEvent;
import com.quizapp.dto.ws.WsMessage;
import com.quizapp.dto.ws.WsQuestion;
import com.quizapp.dto.ws.WsResult;
import com.quizapp.entity.Question;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class WebSocketService {

  private final SimpMessagingTemplate messagingTemplate;

  public void sendQuestion(Long sessionId, Question question) {
    List<AnswerOptionResponse> options =
        question.getAnswerOptions().stream()
            .map(
                opt ->
                    AnswerOptionResponse.builder()
                        .id(opt.getId())
                        .text(opt.getText())
                        .isCorrect(opt.getIsCorrect())
                        .build())
            .toList();
    WsQuestion wsQuestion =
        WsQuestion.builder()
            .questionId(question.getId())
            .text(question.getText())
            .imageUrl(question.getImageUrl())
            .type(question.getType())
            .options(options)
            .duration(20)
            .build();

    send(sessionId, "QUESTION", wsQuestion);
  }

  public void sendResult(
      Long sessionId, String username, boolean isCorrect, int score, int totalAnswered) {
    WsResult result =
        WsResult.builder()
            .username(username)
            .isCorrect(isCorrect)
            .score(score)
            .totalAnswered(totalAnswered)
            .build();
    send(sessionId, "RESULT", result);
  }

  public void sendEvent(Long sessionId, String event, String message) {
    WsGameEvent gameEvent = WsGameEvent.builder().event(event).message(message).build();
    send(sessionId, "EVENT", gameEvent);
  }

  private void send(Long sessionId, String type, Object payload) {
    WsMessage wsMessage = new WsMessage(type, payload);
    messagingTemplate.convertAndSend("/topic/session/" + sessionId, wsMessage);
  }

  public void startQuestion(Long sessionId, Long questionId) {

    QuestionStartedEvent event =
        QuestionStartedEvent.builder().questionId(questionId).duration(20).build();

    send(sessionId, "QUESTION_STARTED", event);
  }
}
