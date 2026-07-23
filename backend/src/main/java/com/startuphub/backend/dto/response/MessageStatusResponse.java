package com.startuphub.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MessageStatusResponse {
    private String userUuid;
    private LocalDateTime deliveredAt;
    private LocalDateTime readAt;
}
