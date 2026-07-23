package com.startuphub.backend.repository;

import com.startuphub.backend.entity.UserProfile;
import com.startuphub.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserProfileRepository extends JpaRepository<UserProfile, Long> {
    Optional<UserProfile> findByUser(User user);
    void deleteByUser(User user);
    java.util.Optional<com.startuphub.backend.entity.UserProfile> findByUserEmail(String email);
    boolean existsByUserEmail(String email);
}

