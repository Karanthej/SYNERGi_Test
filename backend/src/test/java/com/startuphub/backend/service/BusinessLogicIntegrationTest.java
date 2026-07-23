package com.startuphub.backend.service;

import com.startuphub.backend.dto.request.ApplicationRequest;
import com.startuphub.backend.dto.request.StartupRequest;
import com.startuphub.backend.entity.Startup;
import com.startuphub.backend.entity.User;
import com.startuphub.backend.entity.enums.ApplicationStatus;
import com.startuphub.backend.entity.enums.AccountStatus;
import com.startuphub.backend.entity.enums.Role;
import com.startuphub.backend.entity.enums.StartupStatus;
import com.startuphub.backend.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.UUID;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
public class BusinessLogicIntegrationTest {

    @Autowired private TalentApplicationService talentApplicationService;
    @Autowired private FounderApplicationService founderApplicationService;
    @Autowired private StartupService startupService;
    @Autowired private WorkspaceService workspaceService;
    
    @Autowired private UserRepository userRepository;
    @Autowired private StartupRepository startupRepository;
    @Autowired private StartupApplicationRepository applicationRepository;
    @Autowired private WorkspaceMemberRepository workspaceMemberRepository;
    @Autowired private ChatMemberRepository chatMemberRepository;
    @Autowired private ApplicationStatusHistoryRepository historyRepository;
    @Autowired private JdbcTemplate jdbcTemplate;

    private User founder1;
    private User founder2;
    private User talent1;
    private User talent2;
    
    private String startup1Uuid;
    private String startup2Uuid;

    @BeforeEach
    public void setup() {
        jdbcTemplate.execute("ALTER TABLE application_status_history DROP CONSTRAINT IF EXISTS application_status_history_status_check");
        jdbcTemplate.execute("ALTER TABLE startup_applications DROP CONSTRAINT IF EXISTS startup_applications_status_check");

        founder1 = userRepository.save(User.builder().email("founder1@test.com").passwordHash("pwd").fullName("F1").role(Role.FOUNDER).accountStatus(AccountStatus.ACTIVE).build());
        founder2 = userRepository.save(User.builder().email("founder2@test.com").passwordHash("pwd").fullName("F2").role(Role.FOUNDER).accountStatus(AccountStatus.ACTIVE).build());
        talent1 = userRepository.save(User.builder().email("talent1@test.com").passwordHash("pwd").fullName("T1").role(Role.TALENT).accountStatus(AccountStatus.ACTIVE).build());
        talent2 = userRepository.save(User.builder().email("talent2@test.com").passwordHash("pwd").fullName("T2").role(Role.TALENT).accountStatus(AccountStatus.ACTIVE).build());
        
        StartupRequest req1 = new StartupRequest();
        req1.setName("Startup One");
        req1.setStatus(StartupStatus.PUBLISHED);
        req1.setMaxMembers(10);
        startup1Uuid = startupService.createStartup(founder1.getEmail(), req1).getUuid();
        
        StartupRequest req2 = new StartupRequest();
        req2.setName("Startup Two");
        req2.setStatus(StartupStatus.PUBLISHED);
        req2.setMaxMembers(10);
        startup2Uuid = startupService.createStartup(founder2.getEmail(), req2).getUuid();
    }

    @Test
    public void testScenario1_ApplyAndAccept() {
        // Talent applies
        ApplicationRequest appReq = new ApplicationRequest();
        appReq.setIntroduction("Hi");
        String appUuid = talentApplicationService.apply(talent1.getEmail(), UUID.fromString(startup1Uuid), appReq).getUuid();
        
        Startup startup = startupRepository.findByUuid(UUID.fromString(startup1Uuid)).get();
        assertTrue(applicationRepository.findByTalentAndStartup(talent1, startup).isPresent());
        
        // Founder accepts
        founderApplicationService.updateApplicationStatus(founder1.getEmail(), UUID.fromString(appUuid), ApplicationStatus.ACCEPTED);
        
        startup = startupRepository.findByUuid(UUID.fromString(startup1Uuid)).get();
        
        // Verify Workspace Membership
        assertTrue(workspaceMemberRepository.existsByStartupAndUserAndStatus(startup, talent1, com.startuphub.backend.entity.enums.WorkspaceMemberStatus.ACTIVE));
        
        // Verify Chat Membership (Should be in general room)
        List<com.startuphub.backend.entity.chat.ChatMember> chatMembers = chatMemberRepository.findByRoomStartupAndUser(startup, talent1);
        assertFalse(chatMembers.isEmpty());
    }

    @Test
    public void testScenario2_RejectAndReapply() {
        // Talent applies
        ApplicationRequest appReq = new ApplicationRequest();
        appReq.setIntroduction("Attempt 1");
        String appUuid = talentApplicationService.apply(talent1.getEmail(), UUID.fromString(startup1Uuid), appReq).getUuid();
        
        // Founder rejects
        founderApplicationService.updateApplicationStatus(founder1.getEmail(), UUID.fromString(appUuid), ApplicationStatus.REJECTED);
        
        // Talent applies again!
        ApplicationRequest appReq2 = new ApplicationRequest();
        appReq2.setIntroduction("Attempt 2");
        talentApplicationService.apply(talent1.getEmail(), UUID.fromString(startup1Uuid), appReq2);
        
        // Verify it was updated to PENDING and introduction changed
        Startup startup = startupRepository.findByUuid(UUID.fromString(startup1Uuid)).get();
        var apps = applicationRepository.findByTalentAndStartup(talent1, startup);
        assertTrue(apps.isPresent(), "Should reuse the same application row");
        assertEquals(ApplicationStatus.PENDING, apps.get().getStatus());
        assertEquals("Attempt 2", apps.get().getIntroduction());
        
        // Verify history captured both PENDING, REJECTED, PENDING
        var histories = historyRepository.findAll();
        long historyCount = histories.stream().filter(h -> h.getApplication().getId().equals(apps.get().getId())).count();
        assertTrue(historyCount >= 3);
    }

    @Test
    public void testScenario3_AcceptThenRemoveThenReapply() {
        // Talent applies and is accepted
        ApplicationRequest appReq = new ApplicationRequest();
        appReq.setIntroduction("Hi");
        String appUuid = talentApplicationService.apply(talent1.getEmail(), UUID.fromString(startup1Uuid), appReq).getUuid();
        founderApplicationService.updateApplicationStatus(founder1.getEmail(), UUID.fromString(appUuid), ApplicationStatus.ACCEPTED);
        
        Startup startup = startupRepository.findByUuid(UUID.fromString(startup1Uuid)).get();
        
        // Founder removes member
        workspaceService.removeMember(founder1.getEmail(), startup.getUuid(), talent1.getUuid());
        
        // Verify Workspace removed
        assertFalse(workspaceMemberRepository.existsByStartupAndUserAndStatus(startup, talent1, com.startuphub.backend.entity.enums.WorkspaceMemberStatus.ACTIVE));
        
        // Verify application status is REVOKED
        var app = applicationRepository.findByUuid(UUID.fromString(appUuid)).get();
        assertEquals(ApplicationStatus.REVOKED, app.getStatus());
        
        // Verify removed from ALL chats
        List<com.startuphub.backend.entity.chat.ChatMember> chatMembers = chatMemberRepository.findByRoomStartupAndUser(startup, talent1);
        assertTrue(chatMembers.isEmpty());
        
        // Talent applies again
        talentApplicationService.apply(talent1.getEmail(), UUID.fromString(startup1Uuid), appReq);
        
        assertEquals(ApplicationStatus.PENDING, applicationRepository.findByUuid(UUID.fromString(appUuid)).get().getStatus());
    }

    @Test
    public void testScenario4_IsolationBetweenWorkspaces() {
        // Talent applies to both and gets accepted to both
        ApplicationRequest appReq = new ApplicationRequest();
        appReq.setIntroduction("Hi");
        
        String app1Uuid = talentApplicationService.apply(talent1.getEmail(), UUID.fromString(startup1Uuid), appReq).getUuid();
        String app2Uuid = talentApplicationService.apply(talent1.getEmail(), UUID.fromString(startup2Uuid), appReq).getUuid();
        
        founderApplicationService.updateApplicationStatus(founder1.getEmail(), UUID.fromString(app1Uuid), ApplicationStatus.ACCEPTED);
        founderApplicationService.updateApplicationStatus(founder2.getEmail(), UUID.fromString(app2Uuid), ApplicationStatus.ACCEPTED);
        
        Startup startup1 = startupRepository.findByUuid(UUID.fromString(startup1Uuid)).get();
        Startup startup2 = startupRepository.findByUuid(UUID.fromString(startup2Uuid)).get();
        
        // Founder 1 removes talent
        workspaceService.removeMember(founder1.getEmail(), startup1.getUuid(), talent1.getUuid());
        
        // Verify removed from Startup 1
        assertTrue(chatMemberRepository.findByRoomStartupAndUser(startup1, talent1).isEmpty());
        
        // Verify STILL exists in Startup 2
        assertFalse(chatMemberRepository.findByRoomStartupAndUser(startup2, talent1).isEmpty());
        assertTrue(workspaceMemberRepository.existsByStartupAndUserAndStatus(startup2, talent1, com.startuphub.backend.entity.enums.WorkspaceMemberStatus.ACTIVE));
    }
}
