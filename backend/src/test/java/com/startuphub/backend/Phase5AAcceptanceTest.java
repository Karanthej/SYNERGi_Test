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
import static org.junit.jupiter.api.Assertions.*;

import com.jayway.jsonpath.JsonPath;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
public class Phase5AAcceptanceTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private StartupRepository startupRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    public void testWorkspaceManagementLifecycle() throws Exception {
        String founderClerkId = "clerk_founder_phase5a";
        String talentClerkId = "clerk_talent_phase5a";

        // 1. Setup Founder and Startup
        SyncUserRequest syncFounder = new SyncUserRequest();
        syncFounder.setEmail("founder_phase5a@example.com");
        syncFounder.setFullName("Phase 5A Founder");
        
        mockMvc.perform(post("/api/v1/auth/sync")
                .with(jwt().jwt(jwt -> jwt.subject(founderClerkId)))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(syncFounder)))
               .andExpect(status().isOk());
               
        User founder = userRepository.findByClerkId(founderClerkId).orElseThrow();
        founder.setRole(Role.FOUNDER);
        userRepository.save(founder);

        StartupRequest startupReq = new StartupRequest();
        startupReq.setName("Phase 5A Workspace Startup");
        startupReq.setTagline("Testing workspace mechanics");
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
        syncTalent.setEmail("talent_phase5a@example.com");
        syncTalent.setFullName("Phase 5A Talent");
        
        mockMvc.perform(post("/api/v1/auth/sync")
                .with(jwt().jwt(jwt -> jwt.subject(talentClerkId)))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(syncTalent)))
               .andExpect(status().isOk());

        User talent = userRepository.findByClerkId(talentClerkId).orElseThrow();
        talent.setRole(Role.TALENT);
        userRepository.save(talent);

        // 3. Verify Founder can see workspace
        mockMvc.perform(get("/api/v1/workspaces")
                .with(jwt().jwt(jwt -> jwt.subject(founderClerkId))))
               .andExpect(status().isOk())
               .andExpect(jsonPath("$.data[0].startupUuid").value(startupUuidStr));

        // 4. Talent Applies
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

        // 5. Founder Accepts Application
        mockMvc.perform(put("/api/v1/founder/applications/" + appUuidStr + "/status?status=ACCEPTED")
                .with(jwt().jwt(jwt -> jwt.subject(founderClerkId)).authorities(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_FOUNDER"))))
               .andExpect(status().isOk());

        // 6. Verify Workspace Members List (Founder view)
        mockMvc.perform(get("/api/v1/workspaces/" + startupUuidStr + "/members")
                .with(jwt().jwt(jwt -> jwt.subject(founderClerkId))))
               .andExpect(status().isOk())
               .andExpect(jsonPath("$.data.length()").value(2))
               .andExpect(jsonPath("$.data[?(@.role == 'OWNER')].userUuid").value(founder.getUuid().toString()))
               .andExpect(jsonPath("$.data[?(@.role == 'TEAM_MEMBER')].userUuid").value(talent.getUuid().toString()));

        // 7. Verify Workspace Members List (Talent view)
        mockMvc.perform(get("/api/v1/workspaces/" + startupUuidStr + "/members")
                .with(jwt().jwt(jwt -> jwt.subject(talentClerkId))))
               .andExpect(status().isOk())
               .andExpect(jsonPath("$.data.length()").value(2));

        // 8. Verify Founder cannot remove themselves
        mockMvc.perform(delete("/api/v1/workspaces/" + startupUuidStr + "/members/" + founder.getUuid().toString())
                .with(jwt().jwt(jwt -> jwt.subject(founderClerkId))))
               .andExpect(status().isBadRequest())
               .andExpect(jsonPath("$.message").value("Founder cannot be removed from the workspace."));

        // 9. Verify Talent cannot remove members
        mockMvc.perform(delete("/api/v1/workspaces/" + startupUuidStr + "/members/" + talent.getUuid().toString())
                .with(jwt().jwt(jwt -> jwt.subject(talentClerkId))))
               .andExpect(status().isBadRequest())
               .andExpect(jsonPath("$.message").value("Only the founder can remove members."));

        // 10. Founder Removes Talent
        mockMvc.perform(delete("/api/v1/workspaces/" + startupUuidStr + "/members/" + talent.getUuid().toString())
                .with(jwt().jwt(jwt -> jwt.subject(founderClerkId))))
               .andExpect(status().isOk());

        // 11. Verify Talent is removed and cannot access workspace
        mockMvc.perform(get("/api/v1/workspaces/" + startupUuidStr + "/members")
                .with(jwt().jwt(jwt -> jwt.subject(talentClerkId))))
               .andExpect(status().isBadRequest())
               .andExpect(jsonPath("$.message").value("You do not have access to this workspace."));

        // 12. Verify Founder sees only themselves
        mockMvc.perform(get("/api/v1/workspaces/" + startupUuidStr + "/members")
                .with(jwt().jwt(jwt -> jwt.subject(founderClerkId))))
               .andExpect(status().isOk())
               .andExpect(jsonPath("$.data.length()").value(1))
               .andExpect(jsonPath("$.data[0].userUuid").value(founder.getUuid().toString()));
    }
}
