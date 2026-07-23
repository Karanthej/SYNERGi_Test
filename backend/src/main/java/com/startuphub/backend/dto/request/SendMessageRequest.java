package com.startuphub.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SendMessageRequest {
    private String tempUuid;
    @NotBlank
    private String content;
    private String replyToMessageUuid;
    private boolean isVoiceNote;
    private Integer voiceNoteDuration;
}
