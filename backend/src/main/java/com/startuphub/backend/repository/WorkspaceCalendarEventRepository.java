package com.startuphub.backend.repository;

import com.startuphub.backend.entity.Startup;
import com.startuphub.backend.entity.WorkspaceCalendarEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface WorkspaceCalendarEventRepository extends JpaRepository<WorkspaceCalendarEvent, Long> {
    List<WorkspaceCalendarEvent> findByStartupOrderByStartDateAsc(Startup startup);
    Optional<WorkspaceCalendarEvent> findByUuid(UUID uuid);
}
