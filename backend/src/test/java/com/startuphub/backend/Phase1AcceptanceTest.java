package com.startuphub.backend;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.startuphub.backend.dto.request.SyncUserRequest;
import com.startuphub.backend.entity.User;
import com.startuphub.backend.entity.enums.Role;
import com.startuphub.backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.junit.jupiter.api.Assertions.*;

import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
public class Phase1AcceptanceTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    public void testUnauthorizedAccess() throws Exception {
        // Direct navigation to protected route without token
        mockMvc.perform(get("/api/v1/profile"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    public void testFounderWorkflow() throws Exception {
        // 1. Clerk Verification & Backend Sync
        String clerkId = "clerk_founder_123";
        SyncUserRequest syncRequest = new SyncUserRequest();
        syncRequest.setEmail("founder+clerk_test@example.com");
        syncRequest.setFullName("Test Founder");

        mockMvc.perform(post("/api/v1/auth/sync")
                .with(jwt().jwt(jwt -> jwt.subject(clerkId)))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(syncRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.email").value("founder+clerk_test@example.com"))
                .andExpect(jsonPath("$.data.role").value("USER"));

        // 2. Verify Database Persistence (Only one row, Role stored)
        assertTrue(userRepository.findByClerkId(clerkId).isPresent());
        User savedUser = userRepository.findByClerkId(clerkId).orElseThrow();
        assertEquals(Role.USER, savedUser.getRole());
        assertNotNull(savedUser.getUsername()); // Username creation check

        // 3. Verify Session Restore / Profile Fetch
        mockMvc.perform(get("/api/v1/profile")
                .with(jwt().jwt(jwt -> jwt.subject(clerkId))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.user.role").value("USER"));
    }

    @Test
    public void testTalentWorkflow() throws Exception {
        // 1. Clerk Verification & Backend Sync
        String clerkId = "clerk_talent_456";
        SyncUserRequest syncRequest = new SyncUserRequest();
        syncRequest.setEmail("talent+clerk_test@example.com");
        syncRequest.setFullName("Test Talent");

        mockMvc.perform(post("/api/v1/auth/sync")
                .with(jwt().jwt(jwt -> jwt.subject(clerkId)))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(syncRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.email").value("talent+clerk_test@example.com"))
                .andExpect(jsonPath("$.data.role").value("USER"));

        // 2. Verify Database Persistence
        assertTrue(userRepository.findByClerkId(clerkId).isPresent());
        User savedUser = userRepository.findByClerkId(clerkId).orElseThrow();
        assertEquals(Role.USER, savedUser.getRole());

        // 3. Role-based Authorization Check (Should be allowed to fetch profile)
        mockMvc.perform(get("/api/v1/profile")
                .with(jwt().jwt(jwt -> jwt.subject(clerkId))))
                .andExpect(status().isOk());
    }

    @Test
    public void testDuplicateSyncPreventsDuplicateUsers() throws Exception {
        String clerkId = "clerk_existing_789";
        SyncUserRequest syncRequest = new SyncUserRequest();
        syncRequest.setEmail("existing@example.com");
        syncRequest.setFullName("Existing User");

        // Sync first time
        mockMvc.perform(post("/api/v1/auth/sync")
                .with(jwt().jwt(jwt -> jwt.subject(clerkId)))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(syncRequest)))
                .andExpect(status().isOk());

        // Sync second time (Simulate refresh / session restore logic)
        mockMvc.perform(post("/api/v1/auth/sync")
                .with(jwt().jwt(jwt -> jwt.subject(clerkId)))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(syncRequest)))
                .andExpect(status().isOk());

        // Verify only 1 record exists in DB for this clerkId
        assertTrue(userRepository.findByClerkId(clerkId).isPresent());
    }
}
