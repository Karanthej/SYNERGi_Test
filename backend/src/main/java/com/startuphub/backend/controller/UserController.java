package com.startuphub.backend.controller;

import com.startuphub.backend.entity.User;
import com.startuphub.backend.repository.UserRepository;
import com.startuphub.backend.exception.BadRequestException;
import com.startuphub.backend.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;

    private static final Pattern USERNAME_PATTERN = Pattern.compile("^[a-z0-9_]{4,20}$");

    @GetMapping("/check-username")
    public ResponseEntity<Map<String, Boolean>> checkUsername(@RequestParam String username) {
        if (username == null || username.trim().isEmpty()) {
            return ResponseEntity.ok(Map.of("available", false));
        }
        
        String cleanUsername = username.trim().toLowerCase();
        
        if (!USERNAME_PATTERN.matcher(cleanUsername).matches()) {
            return ResponseEntity.ok(Map.of("available", false));
        }

        boolean exists = userRepository.existsByUsernameIgnoreCase(cleanUsername);
        return ResponseEntity.ok(Map.of("available", !exists));
    }

    @PostMapping("/set-username")
    public ResponseEntity<Map<String, String>> setUsername(@RequestBody Map<String, String> request, Authentication authentication) {
        System.out.println("====== SET USERNAME CONTROLLER REACHED ======");
        System.out.println("Username from request: " + request.get("username"));
        System.out.println("Authentication: " + authentication);
        
        String username = request.get("username");
        if (username == null || username.trim().isEmpty()) {
            throw new BadRequestException("Username is required");
        }

        String cleanUsername = username.trim().toLowerCase();

        if (!USERNAME_PATTERN.matcher(cleanUsername).matches()) {
            throw new BadRequestException("Username must be 4-20 characters long and contain only lowercase letters, numbers, and underscores.");
        }

        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (user.getUsername() != null && !user.getUsername().isEmpty()) {
            throw new BadRequestException("Username has already been set and cannot be changed.");
        }

        if (userRepository.existsByUsernameIgnoreCase(cleanUsername)) {
            throw new BadRequestException("Username is already taken.");
        }

        user.setUsername(cleanUsername);
        userRepository.save(user);

        return ResponseEntity.ok(Map.of("message", "Username set successfully", "username", cleanUsername));
    }
}
