package com.startuphub.backend;

import com.fasterxml.jackson.databind.ObjectMapper;
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
public class Phase2FounderAcceptanceTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private StartupRepository startupRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    public void testCompleteFounderStartupWorkflow() throws Exception {
        String founderClerkId = "clerk_founder_phase2";
        String talentClerkId = "clerk_talent_phase2";

        // 1. Sync Founder User
        SyncUserRequest syncRequest = new SyncUserRequest();
        syncRequest.setEmail("founder_phase2@example.com");
        syncRequest.setFullName("Phase 2 Founder");
        
        mockMvc.perform(post("/api/v1/auth/sync")
                .with(jwt().jwt(jwt -> jwt.subject(founderClerkId)))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(syncRequest)))
               .andExpect(status().isOk());
               
        // Manually upgrade role to FOUNDER for test purposes (usually done via onboarding)
        User founder = userRepository.findByClerkId(founderClerkId).orElseThrow();
        founder.setRole(Role.FOUNDER);
        userRepository.save(founder);

        // 2. Sync another user (to test ownership security)
        SyncUserRequest syncTalent = new SyncUserRequest();
        syncTalent.setEmail("talent_phase2@example.com");
        syncTalent.setFullName("Phase 2 Talent");
        
        mockMvc.perform(post("/api/v1/auth/sync")
                .with(jwt().jwt(jwt -> jwt.subject(talentClerkId)))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(syncTalent)))
               .andExpect(status().isOk());

        // 3. Create Startup
        StartupRequest startupReq = new StartupRequest();
        startupReq.setName("Phase 2 Disruptor");
        startupReq.setTagline("Disrupting the audit process");
        startupReq.setStatus(StartupStatus.DRAFT);

        String createResponse = mockMvc.perform(post("/api/v1/founder/startups")
                .with(jwt().jwt(jwt -> jwt.subject(founderClerkId)).authorities(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_FOUNDER")))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(startupReq)))
               .andExpect(status().isOk())
               .andExpect(jsonPath("$.data.name").value("Phase 2 Disruptor"))
               .andExpect(jsonPath("$.data.status").value("DRAFT"))
               .andReturn().getResponse().getContentAsString();

        String startupUuidStr = JsonPath.read(createResponse, "$.data.uuid");
        UUID startupUuid = UUID.fromString(startupUuidStr);

        // 4. Verify Database Persistence
        assertTrue(startupRepository.findByUuid(startupUuid).isPresent());
        Startup savedStartup = startupRepository.findByUuid(startupUuid).get();
        assertEquals(founder.getId(), savedStartup.getFounder().getId());

        // 5. Read Startups
        mockMvc.perform(get("/api/v1/founder/startups")
                .with(jwt().jwt(jwt -> jwt.subject(founderClerkId)).authorities(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_FOUNDER"))))
               .andExpect(status().isOk())
               .andExpect(jsonPath("$.data[0].uuid").value(startupUuidStr));

        // 6. Update Startup (Edit)
        startupReq.setName("Phase 2 Disruptor (Updated)");
        mockMvc.perform(put("/api/v1/founder/startups/" + startupUuidStr)
                .with(jwt().jwt(jwt -> jwt.subject(founderClerkId)).authorities(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_FOUNDER")))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(startupReq)))
               .andExpect(status().isOk())
               .andExpect(jsonPath("$.data.name").value("Phase 2 Disruptor (Updated)"));

        // 7. Security: Unauthorized edit attempt
        mockMvc.perform(put("/api/v1/founder/startups/" + startupUuidStr)
                .with(jwt().jwt(jwt -> jwt.subject(talentClerkId)).authorities(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_USER")))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(startupReq)))
               .andExpect(status().isForbidden()); 

        // Wait, if talent was also a FOUNDER, they would get 400 Bad Request because of ownership check.
        User talent = userRepository.findByClerkId(talentClerkId).orElseThrow();
        talent.setRole(Role.FOUNDER);
        userRepository.save(talent);

        mockMvc.perform(put("/api/v1/founder/startups/" + startupUuidStr)
                .with(jwt().jwt(jwt -> jwt.subject(talentClerkId)).authorities(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_FOUNDER")))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(startupReq)))
               .andExpect(status().isBadRequest())
               .andExpect(jsonPath("$.message").value("You do not have permission to access this startup."));

        // 8. Publish Startup
        mockMvc.perform(put("/api/v1/founder/startups/" + startupUuidStr + "/status?status=PUBLISHED")
                .with(jwt().jwt(jwt -> jwt.subject(founderClerkId)).authorities(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_FOUNDER"))))
               .andExpect(status().isOk());

        assertEquals(StartupStatus.PUBLISHED, startupRepository.findByUuid(startupUuid).get().getStatus());

        // 9. Dashboard Access
        mockMvc.perform(get("/api/v1/workspaces/" + startupUuidStr + "/dashboard")
                .with(jwt().jwt(jwt -> jwt.subject(founderClerkId)).authorities(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_FOUNDER"))))
               .andExpect(status().isOk())
               .andExpect(jsonPath("$.data.startupName").value("Phase 2 Disruptor (Updated)"));

        // 10. Delete Startup
        mockMvc.perform(delete("/api/v1/founder/startups/" + startupUuidStr)
                .with(jwt().jwt(jwt -> jwt.subject(founderClerkId)).authorities(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_FOUNDER"))))
               .andExpect(status().isOk());
               
        assertTrue(startupRepository.findByUuid(startupUuid).isEmpty());
    }
}
