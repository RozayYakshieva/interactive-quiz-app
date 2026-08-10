package com.quizapp.repository;

import com.quizapp.entity.GameSession;
import com.quizapp.enums.SessionStatus;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface GameSessionRepository extends JpaRepository<GameSession, Long> {
  Optional<GameSession> findByCode(String code);

  void deleteByCode(String code);

  @Query(
      """
      SELECT s FROM GameSession s
      JOIN FETCH s.quiz q
      WHERE q.organizer.id = :organizerId
        AND s.status = :status
      ORDER BY s.startedAt DESC NULLS LAST, s.id DESC
      """)
  List<GameSession> findFinishedByOrganizerId(
      @Param("organizerId") Long organizerId, @Param("status") SessionStatus status);
}
