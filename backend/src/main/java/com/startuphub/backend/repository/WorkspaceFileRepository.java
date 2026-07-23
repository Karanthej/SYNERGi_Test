package com.startuphub.backend.repository;

import com.startuphub.backend.entity.Startup;
import com.startuphub.backend.entity.WorkspaceFile;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface WorkspaceFileRepository extends JpaRepository<WorkspaceFile, Long> {
    List<WorkspaceFile> findByStartupOrderByCreatedAtDesc(Startup startup);
    Optional<WorkspaceFile> findByUuid(UUID uuid);
}
