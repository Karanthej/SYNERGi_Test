package com.startuphub.backend.repository;

import com.startuphub.backend.entity.User;
import com.startuphub.backend.entity.meeting.Meeting;
import com.startuphub.backend.entity.meeting.MeetingParticipant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MeetingParticipantRepository extends JpaRepository<MeetingParticipant, Long> {
    List<MeetingParticipant> findByMeeting(Meeting meeting);
    Optional<MeetingParticipant> findByMeetingAndUser(Meeting meeting, User user);
    boolean existsByMeetingAndUser(Meeting meeting, User user);
}
