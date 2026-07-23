package com.startuphub.backend.repository;

import com.startuphub.backend.entity.JobOffer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.EntityGraph;

@Repository
public interface JobOfferRepository extends JpaRepository<JobOffer, Long> {

    @EntityGraph(attributePaths = {"startup", "founder", "talent"})
    List<JobOffer> findByTalentIdOrderByCreatedAtDesc(Long talentId);

    @EntityGraph(attributePaths = {"startup", "founder", "talent"})
    List<JobOffer> findByFounderIdOrderByCreatedAtDesc(Long founderId);
    
    Optional<JobOffer> findByUuid(UUID uuid);

    boolean existsByStartupIdAndTalentIdAndStatus(Long startupId, Long talentId, com.startuphub.backend.entity.enums.JobOfferStatus status);
    
    boolean existsByStartupIdAndTalentId(Long startupId, Long talentId);
    
    List<JobOffer> findByStartupAndTalentAndStatus(com.startuphub.backend.entity.Startup startup, com.startuphub.backend.entity.User talent, com.startuphub.backend.entity.enums.JobOfferStatus status);
}
