package com.startuphub.backend.migration;

import com.startuphub.backend.entity.User;
import com.startuphub.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Random;

// @Component
@RequiredArgsConstructor
@Slf4j
public class UsernameMigrationRunner implements ApplicationRunner {

    private final UserRepository userRepository;
    private final Random random = new Random();

    @Override
    public void run(ApplicationArguments args) {
        log.info("Running Username Migration...");
        List<User> allUsers = userRepository.findAll();
        int migratedCount = 0;

        for (User user : allUsers) {
            if (user.getUsername() == null || user.getUsername().trim().isEmpty()) {
                String email = user.getEmail();
                String prefix = email.contains("@") ? email.substring(0, email.indexOf("@")) : email;
                
                // Sanitize: lowercase, remove non-alphanumeric chars (allow underscores)
                String baseUsername = prefix.toLowerCase().replaceAll("[^a-z0-9_]", "");
                
                // Ensure min length of 4
                while (baseUsername.length() < 4) {
                    baseUsername += random.nextInt(10);
                }

                // Truncate to 15 chars to leave room for random suffix
                if (baseUsername.length() > 15) {
                    baseUsername = baseUsername.substring(0, 15);
                }

                String finalUsername = baseUsername;
                while (userRepository.existsByUsernameIgnoreCase(finalUsername)) {
                    finalUsername = baseUsername + "_" + (random.nextInt(900) + 100);
                }

                user.setUsername(finalUsername);
                userRepository.save(user);
                migratedCount++;
                log.info("Migrated user {} to username {}", email, finalUsername);
            }
        }
        
        log.info("Username Migration completed. {} users migrated.", migratedCount);
    }
}
