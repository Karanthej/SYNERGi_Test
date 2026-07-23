package com.startuphub.backend.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.startuphub.backend.entity.User;
import com.startuphub.backend.entity.enums.AccountStatus;
import com.startuphub.backend.entity.enums.Role;
import com.startuphub.backend.repository.UserRepository;
import com.svix.Webhook;
import com.svix.exceptions.WebhookVerificationException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/v1/webhooks")
@RequiredArgsConstructor
public class ClerkWebhookController {

    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    @Value("${clerk.webhook.secret}")
    private String webhookSecret;

    @PostMapping("/clerk")
    public ResponseEntity<String> handleClerkWebhook(
            @RequestHeader HttpHeaders headers,
            @RequestBody String payload
    ) {
        String svixId = headers.getFirst("svix-id");
        String svixTimestamp = headers.getFirst("svix-timestamp");
        String svixSignature = headers.getFirst("svix-signature");

        if (svixId == null || svixTimestamp == null || svixSignature == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Missing svix headers");
        }

        Webhook webhook = new Webhook(webhookSecret);
        try {
            webhook.verify(payload, java.net.http.HttpHeaders.of(headers, (k, v) -> true));
        } catch (WebhookVerificationException e) {
            log.error("Webhook verification failed: ", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid signature");
        }

        try {
            JsonNode root = objectMapper.readTree(payload);
            String type = root.path("type").asText();
            JsonNode data = root.path("data");

            log.info("Received Clerk Webhook type: {}", type);

            if ("user.created".equals(type) || "user.updated".equals(type)) {
                handleUserCreatedOrUpdated(data);
            } else if ("user.deleted".equals(type)) {
                handleUserDeleted(data);
            }

            return ResponseEntity.ok("Success");
        } catch (Exception e) {
            log.error("Error processing Clerk webhook", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error processing webhook");
        }
    }

    private void handleUserCreatedOrUpdated(JsonNode data) {
        String clerkId = data.path("id").asText();
        JsonNode emailAddresses = data.path("email_addresses");
        String primaryEmailId = data.path("primary_email_address_id").asText();
        
        String email = "";
        if (emailAddresses != null && emailAddresses.isArray()) {
            for (JsonNode emailNode : emailAddresses) {
                if (emailNode.path("id").asText().equals(primaryEmailId)) {
                    email = emailNode.path("email_address").asText();
                    break;
                }
            }
            // fallback
            if (email.isEmpty() && emailAddresses.size() > 0) {
                email = emailAddresses.get(0).path("email_address").asText();
            }
        }

        String firstName = data.path("first_name").asText("");
        String lastName = data.path("last_name").asText("");
        String fullName = (firstName + " " + lastName).trim();
        if (fullName.isEmpty()) {
            fullName = "Unknown User";
        }

        String imageUrl = data.path("image_url").asText("");

        Optional<User> existingUserOpt = userRepository.findByClerkId(clerkId);
        
        if (existingUserOpt.isPresent()) {
            User user = existingUserOpt.get();
            user.setFullName(fullName);
            user.setProfileImage(imageUrl);
            user.setEmail(email);
            userRepository.save(user);
            log.info("Updated existing user from Clerk webhook: {}", clerkId);
        } else {
            // Check if email already exists (legacy migration)
            Optional<User> legacyUserOpt = userRepository.findByEmail(email);
            if (legacyUserOpt.isPresent()) {
                User user = legacyUserOpt.get();
                user.setClerkId(clerkId);
                user.setFullName(fullName);
                user.setProfileImage(imageUrl);
                userRepository.save(user);
                log.info("Migrated legacy user from Clerk webhook: {}", clerkId);
            } else {
                User newUser = User.builder()
                        .clerkId(clerkId)
                        .email(email)
                        .fullName(fullName)
                        .profileImage(imageUrl)
                        .passwordHash("EXTERNAL_AUTH")
                        .role(Role.USER) // Will be updated during onboarding
                        .accountStatus(AccountStatus.ACTIVE)
                        .emailVerified(true) // Clerk verifies emails
                        .failedLoginAttempts(0)
                        .uuid(UUID.randomUUID())
                        .build();
                userRepository.save(newUser);
                log.info("Created new user from Clerk webhook: {}", clerkId);
            }
        }
    }

    private void handleUserDeleted(JsonNode data) {
        String clerkId = data.path("id").asText();
        userRepository.findByClerkId(clerkId).ifPresent(user -> {
            user.setAccountStatus(AccountStatus.DELETED);
            userRepository.save(user);
            log.info("Deleted user from Clerk webhook: {}", clerkId);
        });
    }
}
