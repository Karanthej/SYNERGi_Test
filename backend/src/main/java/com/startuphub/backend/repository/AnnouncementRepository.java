package com.startuphub.backend.repository;

import com.startuphub.backend.entity.Announcement;
import com.startuphub.backend.entity.Startup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AnnouncementRepository extends JpaRepository<Announcement, Long> {
    List<Announcement> findByStartupOrderByIsPinnedDescCreatedAtDesc(Startup startup);
    Optional<Announcement> findByUuid(UUID uuid);
}
