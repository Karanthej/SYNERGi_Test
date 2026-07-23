package com.startuphub.backend;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.startuphub.backend.controller.CallWebSocketController;
import com.startuphub.backend.dto.request.ApplicationRequest;
import com.startuphub.backend.dto.request.CallSignalDto;
import com.startuphub.backend.dto.request.StartupRequest;
import com.startuphub.backend.dto.request.SyncUserRequest;
import com.startuphub.backend.entity.User;
import com.startuphub.backend.entity.enums.Role;
import com.startuphub.backend.entity.enums.StartupStatus;
import com.startuphub.backend.repository.UserRepository;
import com.startuphub.backend.service.CallSessionService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.security.Principal;
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
public class E2EAcceptanceTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private CallWebSocketController callWebSocketController;

    @Autowired
    private CallSessionService callSessionService;

    @Test
    public void executeFullSystemIntegrationFlow() throws Exception {
        String founderClerkId = "clerk_founder_e2e_" + UUID.randomUUID().toString().substring(0, 8);
        String talentClerkId = "clerk_talent_e2e_" + UUID.randomUUID().toString().substring(0, 8);

        // ==========================================
        // FLOW 1: Visitor -> Signup -> Sync
        // ==========================================
        SyncUserRequest syncFounder = new SyncUserRequest();
        syncFounder.setEmail("founder_" + founderClerkId + "@example.com");
        syncFounder.setFullName("E2E Founder");
        
        mockMvc.perform(post("/api/v1/auth/sync")
                .with(jwt().jwt(jwt -> jwt.subject(founderClerkId)))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(syncFounder)))
               .andExpect(status().isOk());
               
        User founder = userRepository.findByClerkId(founderClerkId).orElseThrow();
        founder.setRole(Role.FOUNDER);
        userRepository.save(founder);

        SyncUserRequest syncTalent = new SyncUserRequest();
        syncTalent.setEmail("talent_" + talentClerkId + "@example.com");
        syncTalent.setFullName("E2E Talent");
        
        mockMvc.perform(post("/api/v1/auth/sync")
                .with(jwt().jwt(jwt -> jwt.subject(talentClerkId)))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(syncTalent)))
               .andExpect(status().isOk());

        User talent = userRepository.findByClerkId(talentClerkId).orElseThrow();
        talent.setRole(Role.TALENT);
        userRepository.save(talent);

        // ==========================================
        // FLOW 2: Founder -> Create Startup -> Publish
        // ==========================================
        StartupRequest startupReq = new StartupRequest();
        startupReq.setName("E2E Global Ecosystem");
        startupReq.setTagline("Connecting everything");
        startupReq.setStatus(StartupStatus.PUBLISHED);

        String createResponse = mockMvc.perform(post("/api/v1/founder/startups")
                .with(jwt().jwt(jwt -> jwt.subject(founderClerkId)).authorities(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_FOUNDER")))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(startupReq)))
               .andExpect(status().isOk())
               .andReturn().getResponse().getContentAsString();

        String startupUuidStr = JsonPath.read(createResponse, "$.data.uuid");
        UUID startupUuid = UUID.fromString(startupUuidStr);
        
        mockMvc.perform(put("/api/v1/founder/startups/" + startupUuidStr + "/status?status=PUBLISHED")
                .with(jwt().jwt(jwt -> jwt.subject(founderClerkId)).authorities(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_FOUNDER"))))
               .andExpect(status().isOk());

        // Verify exists (Logout -> Login simulation)
        mockMvc.perform(get("/api/v1/founder/startups")
                .with(jwt().jwt(jwt -> jwt.subject(founderClerkId)).authorities(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_FOUNDER"))))
               .andExpect(status().isOk())
               .andExpect(jsonPath("$.data[0].uuid").value(startupUuidStr));

        // ==========================================
        // FLOW 3: Talent -> Browse -> Apply
        // ==========================================
        // Talent searches for startups
        mockMvc.perform(get("/api/v1/talent/startups")
                .with(jwt().jwt(jwt -> jwt.subject(talentClerkId)).authorities(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_TALENT"))))
               .andExpect(status().isOk());

        ApplicationRequest appReq = new ApplicationRequest();
        appReq.setIntroduction("E2E Engineer ready to build.");
        appReq.setPreferredRole("Software Engineer");
        appReq.setSkills("Java");
        appReq.setWhyRightFit("Passionate");
        appReq.setWhyJoin("Great vision");
        
        String applyResponse = mockMvc.perform(post("/api/v1/talent/startups/" + startupUuidStr + "/apply")
                .with(jwt().jwt(jwt -> jwt.subject(talentClerkId)).authorities(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_TALENT")))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(appReq)))
               .andExpect(status().isOk())
               .andReturn().getResponse().getContentAsString();
               
        String appUuidStr = JsonPath.read(applyResponse, "$.data.uuid");

        // Talent verifies application exists
        mockMvc.perform(get("/api/v1/talent/applications")
                .with(jwt().jwt(jwt -> jwt.subject(talentClerkId)).authorities(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_TALENT"))))
               .andExpect(status().isOk())
               .andExpect(jsonPath("$.data.content[0].uuid").value(appUuidStr));

        // ==========================================
        // FLOW 4: Founder -> Review -> Approve
        // ==========================================
        mockMvc.perform(put("/api/v1/founder/applications/" + appUuidStr + "/status?status=ACCEPTED")
                .with(jwt().jwt(jwt -> jwt.subject(founderClerkId)).authorities(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_FOUNDER"))))
               .andExpect(status().isOk());

        // Verify Workspace creation
        mockMvc.perform(get("/api/v1/workspaces/" + startupUuidStr + "/members")
                .with(jwt().jwt(jwt -> jwt.subject(talentClerkId))))
               .andExpect(status().isOk())
               .andExpect(jsonPath("$.data.length()").value(2));

        // ==========================================
        // FLOW 5: Chat & Messages
        // ==========================================
        String roomsResponse = mockMvc.perform(get("/api/v1/workspaces/" + startupUuidStr + "/chat/rooms")
                .with(jwt().jwt(jwt -> jwt.subject(founderClerkId))))
               .andExpect(status().isOk())
               .andExpect(jsonPath("$.data.length()").value(1))
               .andReturn().getResponse().getContentAsString();

        String roomUuidStr = JsonPath.read(roomsResponse, "$.data[0].uuid");

        mockMvc.perform(get("/api/v1/workspaces/" + startupUuidStr + "/chat/rooms/" + roomUuidStr + "/messages")
                .with(jwt().jwt(jwt -> jwt.subject(talentClerkId))))
               .andExpect(status().isOk());

        // ==========================================
        // FLOW 6: Voice Calls 
        // ==========================================
        SimpMessageHeaderAccessor headerAccessor = SimpMessageHeaderAccessor.create();
        headerAccessor.setUser(new Principal() {
            @Override
            public String getName() {
                return founderClerkId;
            }
        });
        headerAccessor.setSessionId("e2e-session-uuid");

        CallSignalDto callSignal = new CallSignalDto();
        callSignal.setType("CALL_REQUEST");
        callSignal.setCallId(UUID.randomUUID());
        callSignal.setCallerId(founder.getUuid());
        callSignal.setReceiverId(talent.getUuid());
        callSignal.setWorkspaceId(startupUuid);

        callWebSocketController.handleCallSignal(callSignal, headerAccessor);
        
        // Assert state transition properly handled
        assertNotNull(callSignal.getState());
    }
}
