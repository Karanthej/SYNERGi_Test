package com.startuphub.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class MarkReadRequest {
    @NotBlank
    private String messageUuid;
}
