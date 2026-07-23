package com.startuphub.backend.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class JobOfferResponse {
    private String uuid;
    private StartupResponse startup;
    private ProfileResponse talent;
    private ProfileResponse founder;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
