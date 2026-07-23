package com.startuphub.backend.repository;

import com.startuphub.backend.entity.Startup;
import com.startuphub.backend.entity.User;
import com.startuphub.backend.entity.WorkspaceMember;
import com.startuphub.backend.entity.enums.WorkspaceMemberStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WorkspaceMemberRepository extends JpaRepository<WorkspaceMember, Long> {
    @EntityGraph(attributePaths = {"startup", "user"})
    List<WorkspaceMember> findByUserAndStatus(User user, WorkspaceMemberStatus status);
    
    @EntityGraph(attributePaths = {"startup", "user"})
    List<WorkspaceMember> findByStartupAndStatus(Startup startup, WorkspaceMemberStatus status);
    
    @EntityGraph(attributePaths = {"startup", "user"})
    Optional<WorkspaceMember> findByStartupAndUser(Startup startup, User user);
    boolean existsByStartupAndUserAndStatus(Startup startup, User user, WorkspaceMemberStatus status);
    
    @org.springframework.data.jpa.repository.Query("SELECT COUNT(m) > 0 FROM WorkspaceMember m WHERE m.startup.uuid = :startupUuid AND m.user.id = :userId")
    boolean existsByStartupUuidAndUserId(@org.springframework.data.repository.query.Param("startupUuid") java.util.UUID startupUuid, @org.springframework.data.repository.query.Param("userId") Long userId);
    
    @org.springframework.data.jpa.repository.Query("SELECT COUNT(m) > 0 FROM WorkspaceMember m WHERE m.startup.id = :startupId AND m.user.id = :userId")
    boolean existsByStartupIdAndUserId(@org.springframework.data.repository.query.Param("startupId") Long startupId, @org.springframework.data.repository.query.Param("userId") Long userId);
    
    long countByStartupInAndStatus(List<Startup> startups, WorkspaceMemberStatus status);
    long countByStartupAndStatus(Startup startup, WorkspaceMemberStatus status);
}
