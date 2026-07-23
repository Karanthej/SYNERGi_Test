package com.startuphub.backend.repository;

import com.startuphub.backend.entity.Startup;
import com.startuphub.backend.entity.WorkspaceAnnouncement;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface WorkspaceAnnouncementRepository extends JpaRepository<WorkspaceAnnouncement, Long> {
    List<WorkspaceAnnouncement> findByStartupOrderByCreatedAtDesc(Startup startup);
    Optional<WorkspaceAnnouncement> findByUuid(UUID uuid);
}
