package com.startuphub.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import java.util.UUID;

@Data
public class EditMessageRequest {
    @NotBlank
    private String messageUuid;
    @NotBlank
    private String content;
}
