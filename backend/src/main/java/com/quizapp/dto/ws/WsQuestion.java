package com.quizapp.dto.ws;

import com.quizapp.dto.AnswerOptionResponse;
import com.quizapp.enums.QuestionType;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class WsQuestion {
  private Long questionId;
  private String text;
  private String imageUrl;
  private QuestionType type;
  private List<AnswerOptionResponse> options;
  private Integer duration;
}
