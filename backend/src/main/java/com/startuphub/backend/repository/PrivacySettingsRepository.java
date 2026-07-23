package com.startuphub.backend.repository;

import com.startuphub.backend.entity.PrivacySettings;
import com.startuphub.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PrivacySettingsRepository extends JpaRepository<PrivacySettings, Long> {
    Optional<PrivacySettings> findByUser(User user);
    void deleteByUser(User user);
}
