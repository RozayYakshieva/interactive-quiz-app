package com.quizapp.dto;

import com.quizapp.enums.QuestionType;
import java.util.List;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class QuestionResponse {
  private Long id;
  private Long quizId;
  private String text;
  private QuestionType type;
  private String imageUrl;
  private List<AnswerOptionResponse> answerOptions;
}
