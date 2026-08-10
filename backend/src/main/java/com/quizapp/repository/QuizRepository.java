package com.quizapp.repository;

import com.quizapp.entity.Quiz;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface QuizRepository extends JpaRepository<Quiz, Long> {
  List<Quiz> findByOrganizerId(Long organizerId);

  void delete(Quiz quiz);
}
