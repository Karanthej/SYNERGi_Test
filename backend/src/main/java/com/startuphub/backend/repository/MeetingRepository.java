package com.startuphub.backend.repository;

import com.startuphub.backend.entity.Startup;
import com.startuphub.backend.entity.meeting.Meeting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MeetingRepository extends JpaRepository<Meeting, Long> {
    Optional<Meeting> findByUuid(UUID uuid);
    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"creator", "startup"})
    List<Meeting> findByStartupOrderByCreatedAtDesc(Startup startup);
}
