package com.startuphub.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ReactionRequest {
    @NotBlank
    private String messageUuid;
    @NotBlank
    private String emoji;
}
