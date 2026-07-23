package com.startuphub.backend.repository;

import com.startuphub.backend.entity.Startup;
import com.startuphub.backend.entity.WorkspaceActivityLog;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface WorkspaceActivityLogRepository extends JpaRepository<WorkspaceActivityLog, Long> {
    List<WorkspaceActivityLog> findByStartupOrderByCreatedAtDesc(Startup startup);
}
