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
public class ReadReceiptResponse {
    private String userUuid;
    private String messageUuid;
    private LocalDateTime messageCreatedAt;
    private LocalDateTime readAt;
}
