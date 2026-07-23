package com.startuphub.backend.repository;

import com.startuphub.backend.entity.StartupView;
import com.startuphub.backend.entity.User;
import com.startuphub.backend.entity.Startup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;

@Repository
public interface StartupViewRepository extends JpaRepository<StartupView, Long> {
    boolean existsByUserAndStartupAndCreatedAtAfter(User user, Startup startup, LocalDateTime time);
    long countByStartup(Startup startup);
}
