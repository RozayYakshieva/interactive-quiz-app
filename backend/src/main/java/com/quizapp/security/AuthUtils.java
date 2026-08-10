package com.quizapp.security;

import com.quizapp.entity.User;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;

public final class AuthUtils {

  private AuthUtils() {}

  public static User getCurrentUser(Authentication authentication) {
    if (authentication == null || !(authentication.getPrincipal() instanceof AppUserDetails)) {
      throw new IllegalStateException("User not authenticated");
    }
    return ((AppUserDetails) authentication.getPrincipal()).getUser();
  }

  public static String getCurrentUserEmail() {
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

    if (authentication == null || !(authentication.getPrincipal() instanceof UserDetails)) {
      throw new IllegalStateException("User not authenticated");
    }

    return ((UserDetails) authentication.getPrincipal()).getUsername();
  }
}
