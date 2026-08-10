package com.quizapp.repository;

import com.quizapp.entity.Question;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface QuestionsRepository extends JpaRepository<Question, Long> {
  List<Question> findByQuizId(Long quizId);

  long countByQuizId(Long quizId);

  @Query(
      "SELECT DISTINCT q FROM Question q LEFT JOIN FETCH q.answerOptions LEFT JOIN FETCH q.quiz"
          + " WHERE q.quiz.id = :quizId ORDER BY q.id ASC")
  List<Question> findByQuizIdWithOptionsOrderByIdAsc(@Param("quizId") Long quizId);

  @Query(
      "SELECT q FROM Question q LEFT JOIN FETCH q.answerOptions LEFT JOIN FETCH q.quiz"
          + " WHERE q.id = :id")
  Optional<Question> findWithAnswerOptionsById(@Param("id") Long id);
}
