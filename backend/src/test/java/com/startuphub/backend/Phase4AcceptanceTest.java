package com.startuphub.backend;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.startuphub.backend.dto.request.ApplicationRequest;
import com.startuphub.backend.dto.request.StartupRequest;
import com.startuphub.backend.dto.request.SyncUserRequest;
import com.startuphub.backend.entity.Startup;
import com.startuphub.backend.entity.User;
import com.startuphub.backend.entity.enums.Role;
import com.startuphub.backend.entity.enums.StartupStatus;
import com.startuphub.backend.repository.ChatMemberRepository;
import com.startuphub.backend.repository.ChatRoomRepository;
import com.startuphub.backend.repository.StartupRepository;
import com.startuphub.backend.repository.UserRepository;
import com.startuphub.backend.repository.WorkspaceMemberRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.junit.jupiter.api.Assertions.*;

import org.springframework.transaction.annotation.Transactional;
import com.jayway.jsonpath.JsonPath;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
public class Phase4AcceptanceTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private StartupRepository startupRepository;

    @Autowired
    private WorkspaceMemberRepository workspaceMemberRepository;
    
    @Autowired
    private ChatRoomRepository chatRoomRepository;
    
    @Autowired
    private ChatMemberRepository chatMemberRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    public void testApplicationLifecycleAndWorkspaceSync() throws Exception {
        String founderClerkId = "clerk_founder_phase4";
        String talentClerkId = "clerk_talent_phase4";

        // 1. Setup Founder and Startup
        SyncUserRequest syncFounder = new SyncUserRequest();
        syncFounder.setEmail("founder_phase4@example.com");
        syncFounder.setFullName("Phase 4 Founder");
        
        mockMvc.perform(post("/api/v1/auth/sync")
                .with(jwt().jwt(jwt -> jwt.subject(founderClerkId)))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(syncFounder)))
               .andExpect(status().isOk());
               
        User founder = userRepository.findByClerkId(founderClerkId).orElseThrow();
        founder.setRole(Role.FOUNDER);
        userRepository.save(founder);

        StartupRequest startupReq = new StartupRequest();
        startupReq.setName("Phase 4 AI Startup");
        startupReq.setTagline("Revolutionizing application lifecycle");
        startupReq.setStatus(StartupStatus.PUBLISHED);

        String createResponse = mockMvc.perform(post("/api/v1/founder/startups")
                .with(jwt().jwt(jwt -> jwt.subject(founderClerkId)).authorities(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_FOUNDER")))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(startupReq)))
               .andExpect(status().isOk())
               .andReturn().getResponse().getContentAsString();

        String startupUuidStr = JsonPath.read(createResponse, "$.data.uuid");
        
        // Publish it so talent can see it
        mockMvc.perform(put("/api/v1/founder/startups/" + startupUuidStr + "/status?status=PUBLISHED")
                .with(jwt().jwt(jwt -> jwt.subject(founderClerkId)).authorities(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_FOUNDER"))))
               .andExpect(status().isOk());

        // 2. Setup Talent User
        SyncUserRequest syncTalent = new SyncUserRequest();
        syncTalent.setEmail("talent_phase4@example.com");
        syncTalent.setFullName("Phase 4 Talent");
        
        mockMvc.perform(post("/api/v1/auth/sync")
                .with(jwt().jwt(jwt -> jwt.subject(talentClerkId)))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(syncTalent)))
               .andExpect(status().isOk());

        User talent = userRepository.findByClerkId(talentClerkId).orElseThrow();
        talent.setRole(Role.TALENT);
        userRepository.save(talent);

        // 3. Talent Applies
        ApplicationRequest appReq = new ApplicationRequest();
        appReq.setIntroduction("Hello, I am a software engineer.");
        appReq.setPreferredRole("Software Engineer");
        appReq.setSkills("Java, Spring Boot");
        appReq.setWhyRightFit("I have 10 years of experience.");
        appReq.setWhyJoin("I love this startup.");
        
        String applyResponse = mockMvc.perform(post("/api/v1/talent/startups/" + startupUuidStr + "/apply")
                .with(jwt().jwt(jwt -> jwt.subject(talentClerkId)).authorities(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_TALENT")))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(appReq)))
               .andExpect(status().isOk())
               .andReturn().getResponse().getContentAsString();
               
        String appUuidStr = JsonPath.read(applyResponse, "$.data.uuid");

        // 4. Founder Rejects Application
        mockMvc.perform(put("/api/v1/founder/applications/" + appUuidStr + "/status?status=REJECTED")
                .with(jwt().jwt(jwt -> jwt.subject(founderClerkId)).authorities(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_FOUNDER"))))
               .andExpect(status().isOk());
               
        // 5. Verify WorkspaceMember is NOT created
        Startup startup = startupRepository.findByUuid(UUID.fromString(startupUuidStr)).orElseThrow();
        assertFalse(workspaceMemberRepository.existsByStartupAndUserAndStatus(startup, talent, com.startuphub.backend.entity.enums.WorkspaceMemberStatus.ACTIVE));

        // 6. Founder attempts to REJECT AGAIN -> Expect 400
        mockMvc.perform(put("/api/v1/founder/applications/" + appUuidStr + "/status?status=REJECTED")
                .with(jwt().jwt(jwt -> jwt.subject(founderClerkId)).authorities(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_FOUNDER"))))
               .andExpect(status().isBadRequest())
               .andExpect(jsonPath("$.message").value("Application is already in the requested status"));
               
        // 7. Talent reapplies (new application)
        String applyResponse2 = mockMvc.perform(post("/api/v1/talent/startups/" + startupUuidStr + "/apply")
                .with(jwt().jwt(jwt -> jwt.subject(talentClerkId)).authorities(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_TALENT")))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(appReq)))
               .andExpect(status().isOk())
               .andReturn().getResponse().getContentAsString();
               
        String appUuidStr2 = JsonPath.read(applyResponse2, "$.data.uuid");

        // 8. Founder Accepts Application
        mockMvc.perform(put("/api/v1/founder/applications/" + appUuidStr2 + "/status?status=ACCEPTED")
                .with(jwt().jwt(jwt -> jwt.subject(founderClerkId)).authorities(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_FOUNDER"))))
               .andExpect(status().isOk());
               
        // 9. Verify WorkspaceMember IS created and ACTIVE
        assertTrue(workspaceMemberRepository.existsByStartupAndUserAndStatus(startup, talent, com.startuphub.backend.entity.enums.WorkspaceMemberStatus.ACTIVE));
        
        // 10. Verify ChatMember IS created for the GENERAL room
        com.startuphub.backend.entity.chat.ChatRoom generalRoom = chatRoomRepository.findByStartupAndType(startup, com.startuphub.backend.entity.enums.ChatRoomType.GENERAL).orElseThrow();
        assertTrue(chatMemberRepository.existsByRoomAndUser(generalRoom, talent));

        // 11. Founder attempts to ACCEPT AGAIN -> Expect 400
        mockMvc.perform(put("/api/v1/founder/applications/" + appUuidStr2 + "/status?status=ACCEPTED")
                .with(jwt().jwt(jwt -> jwt.subject(founderClerkId)).authorities(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_FOUNDER"))))
               .andExpect(status().isBadRequest())
               .andExpect(jsonPath("$.message").value("Application is already in the requested status"));
    }
}
