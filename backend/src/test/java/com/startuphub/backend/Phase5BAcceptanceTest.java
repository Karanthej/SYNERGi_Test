package com.startuphub.backend;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.startuphub.backend.dto.request.ApplicationRequest;
import com.startuphub.backend.dto.request.StartupRequest;
import com.startuphub.backend.dto.request.SyncUserRequest;
import com.startuphub.backend.entity.Startup;
import com.startuphub.backend.entity.User;
import com.startuphub.backend.entity.enums.Role;
import com.startuphub.backend.entity.enums.StartupStatus;
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

import com.jayway.jsonpath.JsonPath;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
public class Phase5BAcceptanceTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private StartupRepository startupRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    public void testChatIdentitySynchronization() throws Exception {
        String founderClerkId = "clerk_founder_phase5b";
        String talentClerkId = "clerk_talent_phase5b";

        // 1. Setup Founder and Startup
        SyncUserRequest syncFounder = new SyncUserRequest();
        syncFounder.setEmail("founder_phase5b@example.com");
        syncFounder.setFullName("Phase 5B Founder");
        
        mockMvc.perform(post("/api/v1/auth/sync")
                .with(jwt().jwt(jwt -> jwt.subject(founderClerkId)))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(syncFounder)))
               .andExpect(status().isOk());
               
        User founder = userRepository.findByClerkId(founderClerkId).orElseThrow();
        founder.setRole(Role.FOUNDER);
        userRepository.save(founder);

        StartupRequest startupReq = new StartupRequest();
        startupReq.setName("Phase 5B Chat Startup");
        startupReq.setTagline("Testing chat mechanics");
        startupReq.setStatus(StartupStatus.PUBLISHED);

        String createResponse = mockMvc.perform(post("/api/v1/founder/startups")
                .with(jwt().jwt(jwt -> jwt.subject(founderClerkId)).authorities(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_FOUNDER")))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(startupReq)))
               .andExpect(status().isOk())
               .andReturn().getResponse().getContentAsString();

        String startupUuidStr = JsonPath.read(createResponse, "$.data.uuid");
        
        mockMvc.perform(put("/api/v1/founder/startups/" + startupUuidStr + "/status?status=PUBLISHED")
                .with(jwt().jwt(jwt -> jwt.subject(founderClerkId)).authorities(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_FOUNDER"))))
               .andExpect(status().isOk());

        // 2. Setup Talent User
        SyncUserRequest syncTalent = new SyncUserRequest();
        syncTalent.setEmail("talent_phase5b@example.com");
        syncTalent.setFullName("Phase 5B Talent");
        
        mockMvc.perform(post("/api/v1/auth/sync")
                .with(jwt().jwt(jwt -> jwt.subject(talentClerkId)))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(syncTalent)))
               .andExpect(status().isOk());

        User talent = userRepository.findByClerkId(talentClerkId).orElseThrow();
        talent.setRole(Role.TALENT);
        userRepository.save(talent);

        // 3. Talent Applies & Founder Accepts (adds talent to workspace and chat)
        ApplicationRequest appReq = new ApplicationRequest();
        appReq.setIntroduction("Hello, I am a software engineer.");
        appReq.setPreferredRole("Software Engineer");
        appReq.setSkills("Java");
        appReq.setWhyRightFit("10 years xp");
        appReq.setWhyJoin("Love this");
        
        String applyResponse = mockMvc.perform(post("/api/v1/talent/startups/" + startupUuidStr + "/apply")
                .with(jwt().jwt(jwt -> jwt.subject(talentClerkId)).authorities(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_TALENT")))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(appReq)))
               .andExpect(status().isOk())
               .andReturn().getResponse().getContentAsString();
               
        String appUuidStr = JsonPath.read(applyResponse, "$.data.uuid");

        mockMvc.perform(put("/api/v1/founder/applications/" + appUuidStr + "/status?status=ACCEPTED")
                .with(jwt().jwt(jwt -> jwt.subject(founderClerkId)).authorities(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_FOUNDER"))))
               .andExpect(status().isOk());

        // 4. Verify Founder can retrieve Chat Rooms using Clerk ID via Principal
        String roomsResponse = mockMvc.perform(get("/api/v1/workspaces/" + startupUuidStr + "/chat/rooms")
                .with(jwt().jwt(jwt -> jwt.subject(founderClerkId))))
               .andExpect(status().isOk())
               .andExpect(jsonPath("$.data.length()").value(1)) // General chat room
               .andReturn().getResponse().getContentAsString();

        String roomUuidStr = JsonPath.read(roomsResponse, "$.data[0].uuid");

        // 5. Verify Talent can retrieve Chat Rooms using Clerk ID via Principal
        mockMvc.perform(get("/api/v1/workspaces/" + startupUuidStr + "/chat/rooms")
                .with(jwt().jwt(jwt -> jwt.subject(talentClerkId))))
               .andExpect(status().isOk())
               .andExpect(jsonPath("$.data.length()").value(1));

        // 6. Verify Talent can retrieve room members
        mockMvc.perform(get("/api/v1/workspaces/" + startupUuidStr + "/chat/rooms/" + roomUuidStr + "/members")
                .with(jwt().jwt(jwt -> jwt.subject(talentClerkId))))
               .andExpect(status().isOk())
               .andExpect(jsonPath("$.data.length()").value(2)); // Founder + Talent

        // 7. Verify Founder can access room messages
        mockMvc.perform(get("/api/v1/workspaces/" + startupUuidStr + "/chat/rooms/" + roomUuidStr + "/messages")
                .with(jwt().jwt(jwt -> jwt.subject(founderClerkId))))
               .andExpect(status().isOk());
    }
}
