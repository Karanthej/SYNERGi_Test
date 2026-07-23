package com.startuphub.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class DeleteMessageRequest {
    @NotBlank
    private String messageUuid;
    private boolean deleteForEveryone;
}
