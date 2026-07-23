package com.startuphub.backend.repository;

import com.startuphub.backend.entity.StartupBookmark;
import com.startuphub.backend.entity.User;
import com.startuphub.backend.entity.Startup;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface StartupBookmarkRepository extends JpaRepository<StartupBookmark, Long> {
    boolean existsByUserAndStartup(User user, Startup startup);
    Optional<StartupBookmark> findByUserAndStartup(User user, Startup startup);
    Page<StartupBookmark> findByUserOrderByCreatedAtDesc(User user, Pageable pageable);
    long countByStartup(Startup startup);
}
