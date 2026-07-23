package com.startuphub.backend;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.startuphub.backend.dto.request.ProfileUpdateRequest;
import com.startuphub.backend.dto.request.StartupRequest;
import com.startuphub.backend.dto.request.SyncUserRequest;
import com.startuphub.backend.entity.Startup;
import com.startuphub.backend.entity.User;
import com.startuphub.backend.entity.WorkspaceMember;
import com.startuphub.backend.entity.StartupApplication;
import com.startuphub.backend.entity.enums.StartupStage;
import com.startuphub.backend.entity.enums.WorkType;
import com.startuphub.backend.entity.enums.CommitmentType;
import com.startuphub.backend.entity.enums.ApplicationStatus;
import com.startuphub.backend.repository.StartupApplicationRepository;
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
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.util.UUID;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
public class ProductionReadinessTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private StartupRepository startupRepository;

    @Autowired
    private StartupApplicationRepository startupApplicationRepository;

    @Autowired
    private WorkspaceMemberRepository workspaceMemberRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    public void testEndToEndProductionWorkflow() throws Exception {
        String founderClerkId = "founder_" + UUID.randomUUID().toString();
        String talentClerkId = "talent_" + UUID.randomUUID().toString();

        // ==========================================
        // JOURNEY 1 - New Founder
        // ==========================================

        // 1. Register through Clerk
        SyncUserRequest founderSync = new SyncUserRequest();
        founderSync.setEmail(founderClerkId + "@founder.com");
        founderSync.setFullName("Prod Founder");
        
        mockMvc.perform(post("/api/v1/auth/sync")
                .with(jwt().jwt(jwt -> jwt.subject(founderClerkId)))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(founderSync)))
               .andExpect(status().isOk());

        // 2. Complete Profile
        ProfileUpdateRequest founderProfile = new ProfileUpdateRequest();
        founderProfile.setFullName("Prod Founder");
        founderProfile.setBio("Experienced Founder");
        
        mockMvc.perform(put("/api/v1/profile")
                .with(jwt().jwt(jwt -> jwt.subject(founderClerkId)).authorities(new SimpleGrantedAuthority("ROLE_FOUNDER")))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(founderProfile)))
               .andExpect(status().isOk());
               
        User founderUser = userRepository.findByClerkId(founderClerkId).orElseThrow();
        founderUser.setRole(com.startuphub.backend.entity.enums.Role.FOUNDER);
        userRepository.save(founderUser);

        // 3. Create & Publish Startup Idea
        StartupRequest startupCreate = new StartupRequest();
        startupCreate.setName("Prod Ready AI");
        startupCreate.setTagline("Transforming the future");
        startupCreate.setStage(StartupStage.IDEA);
        startupCreate.setWorkType(WorkType.REMOTE);
        startupCreate.setCommitmentType(CommitmentType.FULL_TIME);
        
        String startupResponse = mockMvc.perform(post("/api/v1/founder/startups")
                .with(jwt().jwt(jwt -> jwt.subject(founderClerkId)).authorities(new SimpleGrantedAuthority("ROLE_FOUNDER")))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(startupCreate)))
               .andExpect(status().isOk())
               .andExpect(jsonPath("$.data.name").value("Prod Ready AI"))
               .andReturn().getResponse().getContentAsString();
               
        // Extract Startup UUID
        String startupUuid = objectMapper.readTree(startupResponse).get("data").get("uuid").asText();
        
        // Publish Startup
        mockMvc.perform(put("/api/v1/founder/startups/" + startupUuid + "/status?status=PUBLISHED")
                .with(jwt().jwt(jwt -> jwt.subject(founderClerkId)).authorities(new SimpleGrantedAuthority("ROLE_FOUNDER"))))
               .andExpect(status().isOk());

        // ==========================================
        // JOURNEY 2 - New Talent
        // ==========================================

        // 1. Register through Clerk
        SyncUserRequest talentSync = new SyncUserRequest();
        talentSync.setEmail(talentClerkId + "@talent.com");
        talentSync.setFullName("Prod Talent");
        
        mockMvc.perform(post("/api/v1/auth/sync")
                .with(jwt().jwt(jwt -> jwt.subject(talentClerkId)).authorities(new SimpleGrantedAuthority("ROLE_TALENT")))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(talentSync)))
               .andExpect(status().isOk());
               
        User talentUser = userRepository.findByClerkId(talentClerkId).orElseThrow();
        talentUser.setRole(com.startuphub.backend.entity.enums.Role.TALENT);
        userRepository.save(talentUser);

        // 2. Search Startups
        String searchResponse = mockMvc.perform(get("/api/v1/search?q=Prod Ready")
                .with(jwt().jwt(jwt -> jwt.subject(talentClerkId)).authorities(new SimpleGrantedAuthority("ROLE_TALENT"))))
               .andExpect(status().isOk())
               .andExpect(jsonPath("$.data[0].title").value("Prod Ready AI"))
               .andReturn().getResponse().getContentAsString();
               
        String foundStartupId = objectMapper.readTree(searchResponse).get("data").get(0).get("id").asText();

        // 3. Apply to Startup
        String applyRequest = "{\"introduction\":\"Hello, I am a great fit.\",\"whyRightFit\":\"I have the skills.\",\"whyJoin\":\"I love AI.\",\"preferredRole\":\"Developer\",\"skills\":\"Java, Python\"}";
        mockMvc.perform(post("/api/v1/talent/startups/" + foundStartupId + "/apply")
                .with(jwt().jwt(jwt -> jwt.subject(talentClerkId)).authorities(new SimpleGrantedAuthority("ROLE_TALENT")))
                .contentType(MediaType.APPLICATION_JSON)
                .content(applyRequest))
               .andExpect(status().isOk());

        // ==========================================
        // JOURNEY 3 - Founder Approval
        // ==========================================
        
        // Fetch applications for founder
        String applicationsResponse = mockMvc.perform(get("/api/v1/founder/startups/" + startupUuid + "/applications")
                .with(jwt().jwt(jwt -> jwt.subject(founderClerkId)).authorities(new SimpleGrantedAuthority("ROLE_FOUNDER"))))
               .andExpect(status().isOk())
               .andReturn().getResponse().getContentAsString();
               
        String applicationUuid = objectMapper.readTree(applicationsResponse).get("data").get("content").get(0).get("uuid").asText();
        
        // Approve application
        mockMvc.perform(put("/api/v1/founder/applications/" + applicationUuid + "/status")
                .param("status", "ACCEPTED")
                .with(jwt().jwt(jwt -> jwt.subject(founderClerkId)).authorities(new SimpleGrantedAuthority("ROLE_FOUNDER"))))
               .andExpect(status().isOk());

        // Verify Workspace creation
        WorkspaceMember workspace = workspaceMemberRepository.findByStartupAndUser(
            startupRepository.findByUuid(UUID.fromString(startupUuid)).orElseThrow(),
            userRepository.findByClerkId(talentClerkId).orElseThrow()
        ).orElseThrow();
        assertNotNull(workspace);
        
        // Verify Dashboard Updates
        mockMvc.perform(get("/api/v1/analytics/talent")
                .with(jwt().jwt(jwt -> jwt.subject(talentClerkId)).authorities(new SimpleGrantedAuthority("ROLE_TALENT"))))
               .andExpect(status().isOk())
               .andExpect(jsonPath("$.data.applicationsSubmitted").value(1))
               .andExpect(jsonPath("$.data.acceptedStartups").value(1));

        // ==========================================
        // JOURNEY 4 - Collaboration (Chat & Calls)
        // ==========================================
        
        // Fetch Chat Rooms for Talent
        mockMvc.perform(get("/api/v1/workspaces/" + startupUuid + "/chat/rooms")
                .with(jwt().jwt(jwt -> jwt.subject(talentClerkId)).authorities(new SimpleGrantedAuthority("ROLE_TALENT"))))
               .andExpect(status().isOk())
               .andExpect(jsonPath("$.data.length()").value(1));
               
        // Fetch Notifications for Talent
        mockMvc.perform(get("/api/v1/chat/notifications")
                .with(jwt().jwt(jwt -> jwt.subject(talentClerkId)).authorities(new SimpleGrantedAuthority("ROLE_TALENT"))))
               .andExpect(status().isOk());
               
        // Assume all passes means we are robust.
    }
}
