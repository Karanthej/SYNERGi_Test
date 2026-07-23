package com.startuphub.backend;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.startuphub.backend.dto.request.ProfileUpdateRequest;
import com.startuphub.backend.dto.request.SyncUserRequest;
import com.startuphub.backend.entity.User;
import com.startuphub.backend.entity.chat.ChatNotification;
import com.startuphub.backend.entity.enums.ChatNotificationType;
import com.startuphub.backend.entity.chat.ChatRoom;
import com.startuphub.backend.entity.enums.ChatRoomType;
import com.startuphub.backend.entity.Startup;
import com.startuphub.backend.entity.enums.StartupStage;
import com.startuphub.backend.entity.enums.StartupStatus;
import com.startuphub.backend.repository.ChatNotificationRepository;
import com.startuphub.backend.repository.ChatRoomRepository;
import com.startuphub.backend.repository.StartupRepository;
import com.startuphub.backend.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
public class Phase7AcceptanceTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ChatNotificationRepository chatNotificationRepository;

    @Autowired
    private ChatRoomRepository chatRoomRepository;

    @Autowired
    private StartupRepository startupRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    public void testProfileAndNotificationsSynchronization() throws Exception {
        String testClerkId = "clerk_phase7_" + UUID.randomUUID().toString().substring(0, 8);

        // 1. Setup User
        SyncUserRequest syncReq = new SyncUserRequest();
        syncReq.setEmail(testClerkId + "@example.com");
        syncReq.setFullName("Phase 7 User");
        
        mockMvc.perform(post("/api/v1/auth/sync")
                .with(jwt().jwt(jwt -> jwt.subject(testClerkId)))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(syncReq)))
               .andExpect(status().isOk());
               
        User user = userRepository.findByClerkId(testClerkId).orElseThrow();

        // 2. Test Profile Fetch & Update
        mockMvc.perform(get("/api/v1/profile")
                .with(jwt().jwt(jwt -> jwt.subject(testClerkId))))
               .andExpect(status().isOk())
               .andExpect(jsonPath("$.data.user.fullName").value("Phase 7 User"));

        ProfileUpdateRequest profileUpdate = new ProfileUpdateRequest();
        profileUpdate.setFullName("Updated Phase 7 User");
        profileUpdate.setBio("My bio is synced");

        mockMvc.perform(put("/api/v1/profile")
                .with(jwt().jwt(jwt -> jwt.subject(testClerkId)))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(profileUpdate)))
               .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/profile")
                .with(jwt().jwt(jwt -> jwt.subject(testClerkId))))
               .andExpect(status().isOk())
               .andExpect(jsonPath("$.data.user.fullName").value("Updated Phase 7 User"))
               .andExpect(jsonPath("$.data.profile.bio").value("My bio is synced"));

        // 3. Test Notifications
        // Manually create a startup, room and notification in DB to simulate WebSocket generation
        Startup startup = new Startup();
        startup.setName("Test Startup");
        startup.setTagline("Test");
        startup.setDetailedDescription("Test");
        startup.setFounder(user);
        startup.setStage(StartupStage.IDEA);
        startup.setStatus(StartupStatus.PUBLISHED);
        startupRepository.save(startup);

        ChatRoom room = new ChatRoom();
        room.setName("Test Room");
        room.setType(ChatRoomType.PRIVATE);
        room.setStartup(startup);
        chatRoomRepository.save(room);

        ChatNotification notification = new ChatNotification();
        notification.setRecipient(user);
        notification.setRoom(room);
        notification.setContent("You have a new message");
        notification.setType(ChatNotificationType.NEW_MESSAGE);
        notification.setRead(false);
        chatNotificationRepository.save(notification);

        // Retrieve using identity
        mockMvc.perform(get("/api/v1/chat/notifications")
                .with(jwt().jwt(jwt -> jwt.subject(testClerkId))))
               .andExpect(status().isOk())
               .andExpect(jsonPath("$.length()").value(1))
               .andExpect(jsonPath("$[0].content").value("You have a new message"))
               .andExpect(jsonPath("$[0].read").value(false));

        // Mark as Read
        mockMvc.perform(put("/api/v1/chat/notifications/" + notification.getUuid() + "/read")
                .with(jwt().jwt(jwt -> jwt.subject(testClerkId))))
               .andExpect(status().isOk());

        // Verify Read State
        mockMvc.perform(get("/api/v1/chat/notifications")
                .with(jwt().jwt(jwt -> jwt.subject(testClerkId))))
               .andExpect(status().isOk())
               .andExpect(jsonPath("$[0].read").value(true));
    }
}
