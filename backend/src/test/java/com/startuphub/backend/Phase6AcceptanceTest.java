package com.startuphub.backend;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.startuphub.backend.dto.request.ApplicationRequest;
import com.startuphub.backend.dto.request.StartupRequest;
import com.startuphub.backend.dto.request.SyncUserRequest;
import com.startuphub.backend.entity.User;
import com.startuphub.backend.entity.enums.Role;
import com.startuphub.backend.entity.enums.StartupStatus;
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

import com.jayway.jsonpath.JsonPath;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
public class Phase6AcceptanceTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    public void testSearchAndDashboardAnalytics() throws Exception {
        String founderClerkId = "clerk_founder_phase6_" + UUID.randomUUID().toString().substring(0, 8);
        String talentClerkId = "clerk_talent_phase6_" + UUID.randomUUID().toString().substring(0, 8);

        // 1. Setup Users
        SyncUserRequest syncFounder = new SyncUserRequest();
        syncFounder.setEmail(founderClerkId + "@example.com");
        syncFounder.setFullName("Phase 6 Founder");
        
        mockMvc.perform(post("/api/v1/auth/sync")
                .with(jwt().jwt(jwt -> jwt.subject(founderClerkId)))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(syncFounder)))
               .andExpect(status().isOk());
               
        User founder = userRepository.findByClerkId(founderClerkId).orElseThrow();
        founder.setRole(Role.FOUNDER);
        userRepository.save(founder);

        SyncUserRequest syncTalent = new SyncUserRequest();
        syncTalent.setEmail(talentClerkId + "@example.com");
        syncTalent.setFullName("Phase 6 Talent");
        
        mockMvc.perform(post("/api/v1/auth/sync")
                .with(jwt().jwt(jwt -> jwt.subject(talentClerkId)))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(syncTalent)))
               .andExpect(status().isOk());

        User talent = userRepository.findByClerkId(talentClerkId).orElseThrow();
        talent.setRole(Role.TALENT);
        userRepository.save(talent);

        // 2. Setup 1 Published Startup and 1 Draft Startup
        StartupRequest draftReq = new StartupRequest();
        draftReq.setName("Phase 6 Secret Idea");
        draftReq.setTagline("Should not be searchable");
        draftReq.setStatus(StartupStatus.DRAFT);
        mockMvc.perform(post("/api/v1/founder/startups")
                .with(jwt().jwt(jwt -> jwt.subject(founderClerkId)).authorities(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_FOUNDER")))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(draftReq)))
               .andExpect(status().isOk());

        StartupRequest pubReq = new StartupRequest();
        pubReq.setName("Phase 6 Public Startup");
        pubReq.setTagline("Searchable Startup");
        pubReq.setStatus(StartupStatus.PUBLISHED);
        String pubRes = mockMvc.perform(post("/api/v1/founder/startups")
                .with(jwt().jwt(jwt -> jwt.subject(founderClerkId)).authorities(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_FOUNDER")))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(pubReq)))
               .andExpect(status().isOk())
               .andReturn().getResponse().getContentAsString();

        String pubUuidStr = JsonPath.read(pubRes, "$.data.uuid");
        mockMvc.perform(put("/api/v1/founder/startups/" + pubUuidStr + "/status?status=PUBLISHED")
                .with(jwt().jwt(jwt -> jwt.subject(founderClerkId)).authorities(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_FOUNDER"))))
               .andExpect(status().isOk());

        // 3. Global Search Verification
        // Search should ONLY return the PUBLISHED startup, not the DRAFT
        mockMvc.perform(get("/api/v1/search?q=Phase 6")
                .with(jwt().jwt(jwt -> jwt.subject(talentClerkId))))
               .andExpect(status().isOk())
               .andExpect(jsonPath("$.data[?(@.title == 'Phase 6 Secret Idea')]").doesNotExist())
               .andExpect(jsonPath("$.data[?(@.title == 'Phase 6 Public Startup')]").exists())
               .andExpect(jsonPath("$.data[?(@.title == 'Phase 6 Founder')]").exists()); // users are searchable

        // 4. Talent applies and is accepted
        ApplicationRequest appReq = new ApplicationRequest();
        appReq.setIntroduction("Hi");
        appReq.setPreferredRole("Engineer");
        appReq.setSkills("Java");
        appReq.setWhyRightFit("yes");
        appReq.setWhyJoin("yes");
        String applyRes = mockMvc.perform(post("/api/v1/talent/startups/" + pubUuidStr + "/apply")
                .with(jwt().jwt(jwt -> jwt.subject(talentClerkId)).authorities(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_TALENT")))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(appReq)))
               .andExpect(status().isOk())
               .andReturn().getResponse().getContentAsString();
        String appUuidStr = JsonPath.read(applyRes, "$.data.uuid");

        mockMvc.perform(put("/api/v1/founder/applications/" + appUuidStr + "/status?status=ACCEPTED")
                .with(jwt().jwt(jwt -> jwt.subject(founderClerkId)).authorities(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_FOUNDER"))))
               .andExpect(status().isOk());

        // 5. Talent Dashboard Verification
        mockMvc.perform(get("/api/v1/analytics/talent")
                .with(jwt().jwt(jwt -> jwt.subject(talentClerkId)).authorities(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_TALENT"))))
               .andExpect(status().isOk())
               .andExpect(jsonPath("$.data.applicationsSubmitted").value(1))
               .andExpect(jsonPath("$.data.acceptedStartups").value(1))
               .andExpect(jsonPath("$.data.assignedTasks").value(0)); // Task module integration
    }
}
