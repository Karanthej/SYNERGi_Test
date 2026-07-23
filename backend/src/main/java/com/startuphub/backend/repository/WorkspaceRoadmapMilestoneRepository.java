package com.startuphub.backend.repository;

import com.startuphub.backend.entity.Startup;
import com.startuphub.backend.entity.WorkspaceRoadmapMilestone;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface WorkspaceRoadmapMilestoneRepository extends JpaRepository<WorkspaceRoadmapMilestone, Long> {
    List<WorkspaceRoadmapMilestone> findByStartupOrderByDueDateAsc(Startup startup);
    Optional<WorkspaceRoadmapMilestone> findByUuid(UUID uuid);
}
