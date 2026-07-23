package com.startuphub.backend.service;

import com.startuphub.backend.dto.request.ApplicationRequest;
import com.startuphub.backend.dto.response.JobOfferResponse;
import com.startuphub.backend.entity.JobOffer;
import com.startuphub.backend.entity.Startup;
import com.startuphub.backend.entity.User;
import com.startuphub.backend.entity.enums.ChatNotificationType;
import com.startuphub.backend.entity.enums.JobOfferStatus;
import com.startuphub.backend.entity.enums.Role;
import com.startuphub.backend.exception.BadRequestException;
import com.startuphub.backend.exception.ResourceNotFoundException;
import com.startuphub.backend.repository.JobOfferRepository;
import com.startuphub.backend.repository.StartupRepository;
import com.startuphub.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class JobOfferService {

    private final JobOfferRepository jobOfferRepository;
    private final StartupRepository startupRepository;
    private final UserRepository userRepository;
    private final TalentApplicationService talentApplicationService;
    private final StartupService startupService;
    private final ProfileService profileService;
    private final SimpMessagingTemplate messagingTemplate;
    private final ChatNotificationService chatNotificationService;

    @Transactional
    public List<JobOfferResponse> createJobOffers(String founderClerkId, String talentUuid, List<String> startupUuids) {
        User founder = getUserByClerkId(founderClerkId);
        if (founder.getRole() != Role.FOUNDER) {
            throw new BadRequestException("Only Founders can send job offers");
        }

        User talent = userRepository.findByUuid(UUID.fromString(talentUuid))
                .orElseThrow(() -> new ResourceNotFoundException("Talent not found"));

        if (talent.getRole() != Role.TALENT) {
            throw new BadRequestException("Job offers can only be sent to Talent users");
        }

        List<JobOfferResponse> responses = new ArrayList<>();
        for (String startupUuidStr : startupUuids) {
            Startup startup = startupRepository.findByUuid(UUID.fromString(startupUuidStr))
                    .orElseThrow(() -> new ResourceNotFoundException("Startup not found"));

            if (!startup.getFounder().getId().equals(founder.getId())) {
                throw new BadRequestException("You can only send offers for startups you own");
            }

            boolean alreadyExists = jobOfferRepository.existsByStartupIdAndTalentId(startup.getId(), talent.getId());
            if (alreadyExists) {
                throw new BadRequestException("An offer has already been sent to this talent for " + startup.getName());
            }

            JobOffer offer = JobOffer.builder()
                    .founder(founder)
                    .talent(talent)
                    .startup(startup)
                    .status(JobOfferStatus.PENDING)
                    .build();

            offer = jobOfferRepository.save(offer);
            responses.add(mapToResponse(offer));

            // Notify Talent
            chatNotificationService.createSystemNotification(
                talent, 
                founder, 
                startup, 
                ChatNotificationType.JOB_OFFER_SENT, 
                String.format("You received a job offer from %s.", startup.getName()), 
                "/talent/job-offers"
            );
        }

        return responses;
    }

    @Transactional(readOnly = true)
    public List<JobOfferResponse> getTalentJobOffers(String talentClerkId) {
        User talent = getUserByClerkId(talentClerkId);
        return jobOfferRepository.findByTalentIdOrderByCreatedAtDesc(talent.getId())
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<JobOfferResponse> getFounderJobOffers(String founderClerkId) {
        User founder = getUserByClerkId(founderClerkId);
        return jobOfferRepository.findByFounderIdOrderByCreatedAtDesc(founder.getId())
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional
    public void rejectJobOffer(String talentClerkId, String offerUuid) {
        User talent = getUserByClerkId(talentClerkId);
        JobOffer offer = jobOfferRepository.findByUuid(UUID.fromString(offerUuid))
                .orElseThrow(() -> new ResourceNotFoundException("Job offer not found"));

        if (!offer.getTalent().getId().equals(talent.getId())) {
            throw new BadRequestException("Not authorized to reject this offer");
        }
        
        if (offer.getStatus() != JobOfferStatus.PENDING) {
            throw new BadRequestException("Only PENDING job offers can be rejected");
        }

        offer.setStatus(JobOfferStatus.REJECTED);
        jobOfferRepository.save(offer);

        // Notify Founder
        chatNotificationService.createSystemNotification(
            offer.getFounder(), 
            talent, 
            offer.getStartup(), 
            ChatNotificationType.JOB_OFFER_REJECTED, 
            String.format("%s declined your job offer.", talent.getFullName()), 
            "/founder/job-offers"
        );
    }

    @Transactional
    public void applyToJobOffer(String talentClerkId, String offerUuid, ApplicationRequest request) {
        User talent = getUserByClerkId(talentClerkId);
        JobOffer offer = jobOfferRepository.findByUuid(UUID.fromString(offerUuid))
                .orElseThrow(() -> new ResourceNotFoundException("Job offer not found"));

        if (!offer.getTalent().getId().equals(talent.getId())) {
            throw new BadRequestException("Not authorized to apply to this offer");
        }

        if (offer.getStatus() != JobOfferStatus.PENDING) {
            throw new BadRequestException("Can only apply to PENDING job offers");
        }

        offer.setStatus(JobOfferStatus.APPLIED);
        jobOfferRepository.save(offer);

        // Notify Founder
        chatNotificationService.createSystemNotification(
            offer.getFounder(), 
            talent, 
            offer.getStartup(), 
            ChatNotificationType.JOB_OFFER_ACCEPTED, 
            String.format("%s accepted your job offer and submitted an application.", talent.getFullName()), 
            "/founder/applications"
        );

        // Trigger existing Startup Application workflow
        talentApplicationService.apply(talentClerkId, offer.getStartup().getUuid(), request);
    }

    @Transactional
    public void deleteJobOffer(String founderClerkId, String offerUuid) {
        User founder = getUserByClerkId(founderClerkId);
        JobOffer offer = jobOfferRepository.findByUuid(UUID.fromString(offerUuid))
                .orElseThrow(() -> new ResourceNotFoundException("Job offer not found"));

        if (!offer.getFounder().getId().equals(founder.getId())) {
            throw new BadRequestException("Not authorized to delete this offer");
        }

        if (offer.getStatus() != JobOfferStatus.REJECTED) {
            throw new BadRequestException("Only REJECTED offers can be deleted");
        }

        jobOfferRepository.delete(offer);
    }

    private User getUserByClerkId(String clerkId) {
        return userRepository.findByClerkId(clerkId).orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private JobOfferResponse mapToResponse(JobOffer offer) {
        return JobOfferResponse.builder()
                .uuid(offer.getUuid().toString())
                .status(offer.getStatus().name())
                .createdAt(offer.getCreatedAt())
                .updatedAt(offer.getUpdatedAt())
                .startup(startupService.mapToResponse(offer.getStartup()))
                .founder(profileService.getProfileByUser(offer.getFounder()))
                .talent(profileService.getProfileByUser(offer.getTalent()))
                .build();
    }
}
