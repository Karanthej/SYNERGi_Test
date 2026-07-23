package com.startuphub.backend.repository;

import com.startuphub.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);

    Optional<User> findByClerkId(String clerkId);

    Optional<User> findByUsername(String username);

    Optional<User> findByUsernameIgnoreCase(String username);

    Optional<User> findByUuid(UUID uuid);

    boolean existsByEmail(String email);

    boolean existsByUsernameIgnoreCase(String username);

    @org.springframework.data.jpa.repository.Query("SELECT u FROM User u WHERE " +
            "(LOWER(u.fullName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "LOWER(u.username) LIKE LOWER(CONCAT('%', :query, '%'))) " +
            "AND (:role IS NULL OR CAST(u.role AS string) = :role) " +
            "AND u.accountStatus = 'ACTIVE'")
    org.springframework.data.domain.Page<User> searchUsers(
            @org.springframework.data.repository.query.Param("query") String query,
            @org.springframework.data.repository.query.Param("role") String role,
            org.springframework.data.domain.Pageable pageable);

    List<User> findByFullNameContainingIgnoreCaseOrUsernameContainingIgnoreCase(String name, String username);
}
