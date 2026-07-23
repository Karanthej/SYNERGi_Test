package com.startuphub.backend.service;

import com.startuphub.backend.dto.request.MeetingRequest;
import com.startuphub.backend.dto.response.MeetingResponse;
import com.startuphub.backend.entity.Startup;
import com.startuphub.backend.entity.User;
import com.startuphub.backend.entity.enums.MeetingRole;
import com.startuphub.backend.entity.enums.MeetingStatus;
import com.startuphub.backend.entity.enums.MeetingType;
import com.startuphub.backend.entity.meeting.Meeting;
import com.startuphub.backend.entity.meeting.MeetingParticipant;
import com.startuphub.backend.exception.BadRequestException;
import com.startuphub.backend.exception.ResourceNotFoundException;
import com.startuphub.backend.repository.MeetingParticipantRepository;
import com.startuphub.backend.repository.MeetingRepository;
import com.startuphub.backend.repository.StartupRepository;
import com.startuphub.backend.repository.UserRepository;
import com.startuphub.backend.repository.WorkspaceMemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MeetingService {

    private final MeetingRepository meetingRepository;
    private final MeetingParticipantRepository meetingParticipantRepository;
    private final UserRepository userRepository;
    private final StartupRepository startupRepository;
    private final WorkspaceMemberRepository workspaceMemberRepository;

    private User getUser(String email) {
        return userRepository.findByEmail(email).orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private Startup getStartup(UUID startupUuid) {
        return startupRepository.findByUuid(startupUuid).orElseThrow(() -> new ResourceNotFoundException("Startup not found"));
    }

    private void checkWorkspaceAccess(Startup startup, User user) {
        if (!startup.getFounder().getId().equals(user.getId()) &&
                workspaceMemberRepository.findByStartupAndUser(startup, user).isEmpty()) {
            throw new BadRequestException("You do not have access to this workspace");
        }
    }

    private MeetingResponse mapToResponse(Meeting meeting) {
        return MeetingResponse.builder()
                .uuid(meeting.getUuid().toString())
                .title(meeting.getTitle())
                .description(meeting.getDescription())
                .type(meeting.getType().name())
                .status(meeting.getStatus().name())
                .creatorName(meeting.getCreator().getFullName())
                .creatorUuid(meeting.getCreator().getUuid().toString())
                .scheduledStartTime(meeting.getScheduledStartTime())
                .scheduledEndTime(meeting.getScheduledEndTime())
                .startedAt(meeting.getStartedAt())
                .endedAt(meeting.getEndedAt())
                .createdAt(meeting.getCreatedAt())
                .participantCount(meetingParticipantRepository.findByMeeting(meeting).size())
                .build();
    }

    @Transactional
    public MeetingResponse createMeeting(String email, UUID startupUuid, MeetingRequest request) {
        User user = getUser(email);
        Startup startup = getStartup(startupUuid);
        checkWorkspaceAccess(startup, user);

        MeetingType type = MeetingType.valueOf(request.getType().toUpperCase());
        MeetingStatus status = type == MeetingType.INSTANT ? MeetingStatus.ONGOING : MeetingStatus.SCHEDULED;

        Meeting meeting = Meeting.builder()
                .startup(startup)
                .creator(user)
                .title(request.getTitle())
                .description(request.getDescription())
                .type(type)
                .status(status)
                .scheduledStartTime(request.getScheduledStartTime())
                .scheduledEndTime(request.getScheduledEndTime())
                .startedAt(type == MeetingType.INSTANT ? LocalDateTime.now() : null)
                .build();

        meetingRepository.save(meeting);

        MeetingParticipant host = MeetingParticipant.builder()
                .meeting(meeting)
                .user(user)
                .role(MeetingRole.HOST)
                .build();
        meetingParticipantRepository.save(host);

        if (request.getParticipantUuids() != null) {
            for (UUID participantUuid : request.getParticipantUuids()) {
                userRepository.findByUuid(participantUuid).ifPresent(p -> {
                    if (!p.getId().equals(user.getId()) && (startup.getFounder().getId().equals(p.getId()) || workspaceMemberRepository.findByStartupAndUser(startup, p).isPresent())) {
                        meetingParticipantRepository.save(MeetingParticipant.builder()
                                .meeting(meeting)
                                .user(p)
                                .role(MeetingRole.PARTICIPANT)
                                .build());
                    }
                });
            }
        }

        return mapToResponse(meeting);
    }

    @Transactional(readOnly = true)
    public List<MeetingResponse> getMeetings(String email, UUID startupUuid) {
        User user = getUser(email);
        Startup startup = getStartup(startupUuid);
        checkWorkspaceAccess(startup, user);

        return meetingRepository.findByStartupOrderByCreatedAtDesc(startup)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public MeetingResponse getMeeting(String email, UUID startupUuid, UUID meetingUuid) {
        User user = getUser(email);
        Startup startup = getStartup(startupUuid);
        checkWorkspaceAccess(startup, user);

        Meeting meeting = meetingRepository.findByUuid(meetingUuid)
                .orElseThrow(() -> new ResourceNotFoundException("Meeting not found"));

        if (!meeting.getStartup().getId().equals(startup.getId())) {
            throw new BadRequestException("Meeting does not belong to this workspace");
        }

        return mapToResponse(meeting);
    }

    @Transactional
    public void joinMeeting(String email, UUID startupUuid, UUID meetingUuid) {
        User user = getUser(email);
        Startup startup = getStartup(startupUuid);
        checkWorkspaceAccess(startup, user);

        Meeting meeting = meetingRepository.findByUuid(meetingUuid)
                .orElseThrow(() -> new ResourceNotFoundException("Meeting not found"));

        if (meeting.getStatus() == MeetingStatus.COMPLETED) {
            throw new BadRequestException("Meeting has already ended");
        }

        if (meeting.getStatus() == MeetingStatus.SCHEDULED) {
            meeting.setStatus(MeetingStatus.ONGOING);
            meeting.setStartedAt(LocalDateTime.now());
            meetingRepository.save(meeting);
        }

        if (!meetingParticipantRepository.existsByMeetingAndUser(meeting, user)) {
            MeetingParticipant participant = MeetingParticipant.builder()
                    .meeting(meeting)
                    .user(user)
                    .role(MeetingRole.PARTICIPANT)
                    .build();
            meetingParticipantRepository.save(participant);
        }
    }

    @Transactional
    public void leaveMeeting(String email, UUID startupUuid, UUID meetingUuid) {
        User user = getUser(email);
        Meeting meeting = meetingRepository.findByUuid(meetingUuid)
                .orElseThrow(() -> new ResourceNotFoundException("Meeting not found"));

        MeetingParticipant participant = meetingParticipantRepository.findByMeetingAndUser(meeting, user)
                .orElseThrow(() -> new BadRequestException("You are not a participant in this meeting"));

        participant.setLeftAt(LocalDateTime.now());
        meetingParticipantRepository.save(participant);
    }

    @Transactional
    public void endMeeting(String email, UUID startupUuid, UUID meetingUuid) {
        User user = getUser(email);
        Meeting meeting = meetingRepository.findByUuid(meetingUuid)
                .orElseThrow(() -> new ResourceNotFoundException("Meeting not found"));

        MeetingParticipant participant = meetingParticipantRepository.findByMeetingAndUser(meeting, user)
                .orElseThrow(() -> new BadRequestException("You are not a participant"));

        if (participant.getRole() != MeetingRole.HOST) {
            throw new BadRequestException("Only the host can end the meeting");
        }

        meeting.setStatus(MeetingStatus.COMPLETED);
        meeting.setEndedAt(LocalDateTime.now());
        meetingRepository.save(meeting);
    }
}
