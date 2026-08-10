package com.quizapp.repository;

import com.quizapp.entity.Participant;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ParticipantRepository extends JpaRepository<Participant, Long> {
  boolean existsBySessionIdAndUserId(Long sessionId, Long userId);

  boolean existsBySessionIdAndNickname(Long sessionId, String nickname);

  Optional<Participant> findBySessionIdAndUserId(Long sessionId, Long userId);

  List<Participant> findBySessionIdOrderByScoreDesc(Long sessionId);

  List<Participant> findBySessionId(Long sessionId);
}
