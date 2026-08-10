package com.quizapp.exception;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

  private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

  @ExceptionHandler(ResourceNotFoundException.class)
  public ResponseEntity<Map<String, Object>> handleNotFound(ResourceNotFoundException ex) {
    return buildResponse(HttpStatus.NOT_FOUND, ex.getMessage());
  }

  @ExceptionHandler(IllegalStateException.class)
  public ResponseEntity<Map<String, Object>> handleUnauthorized(IllegalStateException ex) {
    return buildResponse(HttpStatus.UNAUTHORIZED, ex.getMessage());
  }

  @ExceptionHandler(IllegalArgumentException.class)
  public ResponseEntity<Map<String, Object>> handleBadRequest(IllegalArgumentException ex) {
    return buildResponse(HttpStatus.BAD_REQUEST, ex.getMessage());
  }

  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException ex) {
    String message =
        ex.getBindingResult().getFieldErrors().stream()
            .map(e -> e.getField() + ": " + e.getDefaultMessage())
            .reduce((a, b) -> a + "; " + b)
            .orElse("Validation error");
    return buildResponse(HttpStatus.BAD_REQUEST, message);
  }

  @ExceptionHandler(HttpMessageNotReadableException.class)
  public ResponseEntity<Map<String, Object>> handleUnreadable(HttpMessageNotReadableException ex) {
    String message = ex.getMostSpecificCause().getMessage();
    if (message == null || message.isBlank()) {
      message = "Invalid request body";
    }
    return buildResponse(HttpStatus.BAD_REQUEST, message);
  }

  @ExceptionHandler(DataIntegrityViolationException.class)
  public ResponseEntity<Map<String, Object>> handleDataIntegrity(
      DataIntegrityViolationException ex) {
    log.warn("Data integrity violation", ex);
    String message = "Unable to save data because of invalid values";
    if (ex.getMessage() != null && ex.getMessage().toLowerCase().contains("image_url")) {
      message = "Image URL is too long or invalid";
    }
    return buildResponse(HttpStatus.BAD_REQUEST, message);
  }

  @ExceptionHandler(Exception.class)
  public ResponseEntity<Map<String, Object>> handleGeneral(Exception ex) {
    log.error("Unhandled exception", ex);
    String message = ex.getMessage();
    if (message == null || message.isBlank()) {
      message = "Internal server error";
    }
    return buildResponse(HttpStatus.INTERNAL_SERVER_ERROR, message);
  }

  private ResponseEntity<Map<String, Object>> buildResponse(HttpStatus status, String message) {
    Map<String, Object> body = new HashMap<>();
    body.put("timestamp", Instant.now().toString());
    body.put("status", status.value());
    body.put("error", status.getReasonPhrase());
    body.put("message", message);
    body.put("detail", message);
    return ResponseEntity.status(status).body(body);
  }
}
