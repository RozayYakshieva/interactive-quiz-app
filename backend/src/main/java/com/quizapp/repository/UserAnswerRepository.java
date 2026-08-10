package com.quizapp.repository;

import com.quizapp.entity.UserAnswer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface UserAnswerRepository extends JpaRepository<UserAnswer, Long> {

  long countByParticipant_Session_IdAndQuestion_Id(Long sessionId, Long questionId);

  boolean existsByParticipant_IdAndQuestion_Id(Long participantId, Long questionId);

  @Query(
      """
      SELECT COUNT(DISTINCT ua.participant.id)
      FROM UserAnswer ua
      WHERE ua.participant.session.id = :sessionId
        AND ua.question.id = :questionId
      """)
  long countDistinctParticipantsBySessionIdAndQuestionId(
      @Param("sessionId") Long sessionId, @Param("questionId") Long questionId);
}
