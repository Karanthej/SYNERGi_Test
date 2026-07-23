package com.startuphub.backend.repository;

import com.startuphub.backend.entity.meeting.Meeting;
import com.startuphub.backend.entity.meeting.MeetingChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;
import java.util.Optional;

@Repository
public interface MeetingChatMessageRepository extends JpaRepository<MeetingChatMessage, Long> {
    List<MeetingChatMessage> findByMeetingOrderByCreatedAtAsc(Meeting meeting);
    Optional<MeetingChatMessage> findByUuid(UUID uuid);
}
