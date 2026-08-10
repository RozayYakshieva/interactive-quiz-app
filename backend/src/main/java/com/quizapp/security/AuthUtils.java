package com.quizapp.security;

import com.quizapp.entity.User;
import org.springframework.security.core.Authentication;

public final class AuthUtils {

  private AuthUtils() {}

  public static User getCurrentUser(Authentication authentication) {
    if (authentication == null || !(authentication.getPrincipal() instanceof AppUserDetails)) {
      throw new IllegalStateException("User not authenticated");
    }
    return ((AppUserDetails) authentication.getPrincipal()).getUser();
  }

  public static User getOptionalUser(Authentication authentication) {
    if (authentication != null && authentication.getPrincipal() instanceof AppUserDetails) {
      return ((AppUserDetails) authentication.getPrincipal()).getUser();
    }
    return null;
  }
}
