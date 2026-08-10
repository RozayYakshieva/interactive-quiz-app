package com.quizapp.config;

import com.quizapp.entity.User;
import com.quizapp.repository.UserRepository;
import com.quizapp.security.AppUserDetails;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.web.filter.OncePerRequestFilter;

@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

  private static final Logger log = LoggerFactory.getLogger(JwtAuthFilter.class);

  private final JwtService jwtService;
  private final UserRepository userRepository;

  @Override
  protected void doFilterInternal(
      @NonNull HttpServletRequest request,
      @NonNull HttpServletResponse response,
      @NonNull FilterChain filterChain)
      throws ServletException, IOException {
    String header = request.getHeader("Authorization");

    if (header != null && header.regionMatches(true, 0, "Bearer ", 0, 7)) {
      String token = header.substring(7).trim();

      if (!token.isEmpty() && jwtService.isTokenValid(token)) {
        Claims claims = jwtService.parseToken(token);
        String email = claims.getSubject();
        Long userId = claims.get("userId", Long.class);

        Optional<User> userOptional =
            userId != null ? userRepository.findById(userId) : Optional.empty();

        if (userOptional.isEmpty() && email != null) {
          userOptional = userRepository.findByEmail(email);
        }

        userOptional.ifPresentOrElse(
            userEntity -> {
              AppUserDetails userDetails = new AppUserDetails(userEntity);

              UsernamePasswordAuthenticationToken authToken =
                  new UsernamePasswordAuthenticationToken(
                      userDetails, null, userDetails.getAuthorities());
              authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
              SecurityContextHolder.getContext().setAuthentication(authToken);
            },
            () ->
                log.warn(
                    "JWT valid but user not found (userId={}, email={}) on {}",
                    userId,
                    email,
                    request.getRequestURI()));
      } else if (!token.isEmpty()) {
        log.warn("Invalid JWT on {} {}", request.getMethod(), request.getRequestURI());
      }
    } else if (request.getRequestURI().startsWith("/api/")
        && !request.getRequestURI().startsWith("/api/auth/")) {
      log.debug("No Authorization header on {} {}", request.getMethod(), request.getRequestURI());
    }

    filterChain.doFilter(request, response);
  }

  @Override
  protected boolean shouldNotFilter(HttpServletRequest request) {
    String path = request.getServletPath();
    return path.equals("/api/sessions/join") || path.startsWith("/ws/");
  }
}
