package com.quizapp.config;

import com.quizapp.repository.UserRepository;
import jakarta.servlet.http.HttpServletResponse;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

  private final JwtService jwtService;
  private final UserRepository userRepository;

  @Bean
  public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    JwtAuthFilter jwtAuthFilter = new JwtAuthFilter(jwtService, userRepository);

    http.cors(cors -> cors.configurationSource(corsConfigurationSource()))
        .csrf(AbstractHttpConfigurer::disable)
        .httpBasic(AbstractHttpConfigurer::disable)
        .formLogin(AbstractHttpConfigurer::disable)
        .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .authorizeHttpRequests(
            auth ->
                auth.requestMatchers(HttpMethod.OPTIONS, "/**")
                    .permitAll()
                    .requestMatchers(HttpMethod.POST, "/api/auth/register")
                    .permitAll()
                    .requestMatchers(HttpMethod.POST, "/api/auth/login")
                    .permitAll()
                    .requestMatchers(HttpMethod.POST, "/api/auth/reset-password")
                    .permitAll()
                    .requestMatchers("/ws/**")
                    .permitAll()
                    .requestMatchers(HttpMethod.POST, "/api/sessions/join")
                    .permitAll()
                    .requestMatchers(HttpMethod.POST, "/api/sessions/*/answer")
                    .permitAll()
                    .requestMatchers(HttpMethod.GET, "/api/sessions/*/answer-progress")
                    .permitAll()
                    .requestMatchers(HttpMethod.GET, "/api/sessions/*/leaderboard")
                    .permitAll()
                    .anyRequest()
                    .authenticated())
        .exceptionHandling(
            ex ->
                ex.authenticationEntryPoint(
                    (request, response, authException) ->
                        response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Unauthorized")))
        .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

    return http.build();
  }

  @Bean
  public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
  }

  @Bean
  public UserDetailsService userDetailsService() {
    return username -> {
      throw new UsernameNotFoundException("Use JWT authentication");
    };
  }

  @Bean
  public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration configuration = new CorsConfiguration();

    configuration.setAllowedOriginPatterns(List.of(
            "http://localhost:*",
            "http://127.0.0.1:*",
            "https://interactive-quiz-app-delta-tan.vercel.app"
    ));

    configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
    configuration.setAllowedHeaders(List.of("*"));
    configuration.setExposedHeaders(List.of("Authorization"));
    configuration.setAllowCredentials(true);

    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/api/**", configuration);
    source.registerCorsConfiguration("/ws/**", configuration);
    return source;
  }
}
