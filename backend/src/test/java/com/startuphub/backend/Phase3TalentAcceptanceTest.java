package com.startuphub.backend;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.startuphub.backend.dto.request.ApplicationRequest;
import com.startuphub.backend.dto.request.StartupRequest;
import com.startuphub.backend.dto.request.SyncUserRequest;
import com.startuphub.backend.entity.Startup;
import com.startuphub.backend.entity.User;
import com.startuphub.backend.entity.enums.Role;
import com.startuphub.backend.entity.enums.StartupStatus;
import com.startuphub.backend.repository.StartupApplicationRepository;
import com.startuphub.backend.repository.StartupRepository;
import com.startuphub.backend.repository.UserRepository;
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
public class Phase3TalentAcceptanceTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private StartupRepository startupRepository;

    @Autowired
    private StartupApplicationRepository applicationRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    public void testCompleteTalentWorkflow() throws Exception {
        String founderClerkId = "clerk_founder_phase3";
        String talentClerkId = "clerk_talent_phase3";
        String unauthUserClerkId = "clerk_unauth_phase3"; // No role

        // 1. Setup Founder and Startup
        SyncUserRequest syncFounder = new SyncUserRequest();
        syncFounder.setEmail("founder_phase3@example.com");
        syncFounder.setFullName("Phase 3 Founder");
        
        mockMvc.perform(post("/api/v1/auth/sync")
                .with(jwt().jwt(jwt -> jwt.subject(founderClerkId)))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(syncFounder)))
               .andExpect(status().isOk());
               
        User founder = userRepository.findByClerkId(founderClerkId).orElseThrow();
        founder.setRole(Role.FOUNDER);
        userRepository.save(founder);

        StartupRequest startupReq = new StartupRequest();
        startupReq.setName("Phase 3 AI Startup");
        startupReq.setTagline("Revolutionizing test suites");
        startupReq.setStatus(StartupStatus.PUBLISHED); // Create as published directly or create then publish

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
        syncTalent.setEmail("talent_phase3@example.com");
        syncTalent.setFullName("Phase 3 Talent");
        
        mockMvc.perform(post("/api/v1/auth/sync")
                .with(jwt().jwt(jwt -> jwt.subject(talentClerkId)))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(syncTalent)))
               .andExpect(status().isOk());

        User talent = userRepository.findByClerkId(talentClerkId).orElseThrow();
        talent.setRole(Role.TALENT);
        userRepository.save(talent);

        // 3. Talent Browse / Search
        mockMvc.perform(get("/api/v1/talent/startups/explore?search=Revolutionizing")
                .with(jwt().jwt(jwt -> jwt.subject(talentClerkId)).authorities(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_TALENT"))))
               .andExpect(status().isOk())
               .andExpect(jsonPath("$.data.content[0].name").value("Phase 3 AI Startup"));

        // 4. Talent View Details
        mockMvc.perform(get("/api/v1/talent/startups/" + startupUuidStr)
                .with(jwt().jwt(jwt -> jwt.subject(talentClerkId)).authorities(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_TALENT"))))
               .andExpect(status().isOk())
               .andExpect(jsonPath("$.data.tagline").value("Revolutionizing test suites"));

        // 5. Unauthorized User Attempting to Apply (Should be forbidden)
        ApplicationRequest appReq = new ApplicationRequest();
        appReq.setIntroduction("Hello, I am a software engineer.");
        appReq.setPreferredRole("Software Engineer");
        appReq.setSkills("Java, Spring Boot");
        appReq.setWhyRightFit("I have 10 years of experience.");
        appReq.setWhyJoin("I love this startup.");
        
        mockMvc.perform(post("/api/v1/talent/startups/" + startupUuidStr + "/apply")
                .with(jwt().jwt(jwt -> jwt.subject(unauthUserClerkId)).authorities(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_USER")))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(appReq)))
               .andExpect(status().isForbidden());

        // 6. Founder Attempting to Apply to their own startup
        mockMvc.perform(post("/api/v1/talent/startups/" + startupUuidStr + "/apply")
                .with(jwt().jwt(jwt -> jwt.subject(founderClerkId)).authorities(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_TALENT"))) // even if founder has talent role
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(appReq)))
               .andExpect(status().isBadRequest())
               .andExpect(jsonPath("$.message").value("Founders cannot apply to their own startups"));

        // 7. Talent Apply
        String applyResponse = mockMvc.perform(post("/api/v1/talent/startups/" + startupUuidStr + "/apply")
                .with(jwt().jwt(jwt -> jwt.subject(talentClerkId)).authorities(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_TALENT")))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(appReq)))
               .andExpect(status().isOk())
               .andExpect(jsonPath("$.data.status").value("PENDING"))
               .andReturn().getResponse().getContentAsString();
               
        String appUuidStr = JsonPath.read(applyResponse, "$.data.uuid");

        // 8. Duplicate Apply Prevention
        mockMvc.perform(post("/api/v1/talent/startups/" + startupUuidStr + "/apply")
                .with(jwt().jwt(jwt -> jwt.subject(talentClerkId)).authorities(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_TALENT")))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(appReq)))
               .andExpect(status().isBadRequest())
               .andExpect(jsonPath("$.message").value("You have already applied to this startup and your application is currently active."));

        // 9. View Application History
        mockMvc.perform(get("/api/v1/talent/applications")
                .with(jwt().jwt(jwt -> jwt.subject(talentClerkId)).authorities(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_TALENT"))))
               .andExpect(status().isOk())
               .andExpect(jsonPath("$.data.content[0].startupName").value("Phase 3 AI Startup"));

        // 10. Withdraw Application
        mockMvc.perform(put("/api/v1/talent/applications/" + appUuidStr + "/withdraw")
                .with(jwt().jwt(jwt -> jwt.subject(talentClerkId)).authorities(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_TALENT"))))
               .andExpect(status().isOk());
               
        // Verify Application is Withdrawn
        mockMvc.perform(get("/api/v1/talent/startups/" + startupUuidStr + "/application-status")
                .with(jwt().jwt(jwt -> jwt.subject(talentClerkId)).authorities(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_TALENT"))))
               .andExpect(status().isOk())
               .andExpect(jsonPath("$.data.status").value("WITHDRAWN"));
    }
}
