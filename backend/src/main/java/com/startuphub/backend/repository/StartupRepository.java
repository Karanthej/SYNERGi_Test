package com.startuphub.backend.repository;

import com.startuphub.backend.entity.Startup;
import com.startuphub.backend.entity.User;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface StartupRepository extends JpaRepository<Startup, Long>, JpaSpecificationExecutor<Startup> {
    @EntityGraph(attributePaths = {"roles", "skills", "founder"})
    List<Startup> findByFounderOrderByUpdatedAtDesc(User founder);
    
    @EntityGraph(attributePaths = {"roles", "skills", "attachments", "founder"})
    Optional<Startup> findByUuid(UUID uuid);
    boolean existsByNameAndFounderId(String name, Long founderId);
    List<Startup> findByNameContainingIgnoreCaseOrTaglineContainingIgnoreCase(String name, String tagline);
    
    @Query("SELECT s FROM Startup s WHERE (LOWER(s.name) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(s.tagline) LIKE LOWER(CONCAT('%', :query, '%'))) AND s.status = :status AND s.isDeleted = false")
    List<Startup> searchActiveStartups(@Param("query") String query, @Param("status") com.startuphub.backend.entity.enums.StartupStatus status);
    
    List<Startup> findByFounderOrderByCreatedAtDesc(com.startuphub.backend.entity.User founder);
}


