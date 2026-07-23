package com.startuphub.backend.repository;

import com.startuphub.backend.entity.Startup;
import com.startuphub.backend.entity.WorkspaceTask;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface WorkspaceTaskRepository extends JpaRepository<WorkspaceTask, Long> {
    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"assignee", "reporter", "startup"})
    List<WorkspaceTask> findByStartupOrderByUpdatedAtDesc(Startup startup);
    
    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"assignee", "reporter", "startup"})
    List<WorkspaceTask> findTop5ByStartupOrderByUpdatedAtDesc(Startup startup);
    Optional<WorkspaceTask> findByUuid(UUID uuid);
    int countByStartup(Startup startup);
    int countByAssignee(com.startuphub.backend.entity.User assignee);
}
