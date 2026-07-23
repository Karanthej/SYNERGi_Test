package com.startuphub.backend.repository;

import com.startuphub.backend.entity.StartupApplication;
import com.startuphub.backend.entity.Startup;
import com.startuphub.backend.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

import java.util.List;
import com.startuphub.backend.entity.enums.ApplicationStatus;

@Repository
public interface StartupApplicationRepository extends JpaRepository<StartupApplication, Long> {
    Optional<StartupApplication> findByUuid(UUID uuid);
    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"talent", "startup"})
    Page<StartupApplication> findByTalentOrderByCreatedAtDesc(User talent, Pageable pageable);
    
    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"talent", "startup"})
    Page<StartupApplication> findByStartupOrderByCreatedAtDesc(Startup startup, Pageable pageable);
    boolean existsByTalentAndStartup(User talent, Startup startup);
    boolean existsByTalentAndStartupAndStatusIn(User talent, Startup startup, List<ApplicationStatus> statuses);
    Optional<StartupApplication> findByTalentAndStartup(User talent, Startup startup);
    
    long countByTalent(User talent);
    long countByTalentAndStatus(User talent, ApplicationStatus status);
    
    long countByStartupInAndStatus(List<Startup> startups, ApplicationStatus status);
}
