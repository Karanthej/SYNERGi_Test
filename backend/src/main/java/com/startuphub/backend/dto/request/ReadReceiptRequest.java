package com.startuphub.backend.dto.request;

import lombok.Data;
import java.util.UUID;

@Data
public class ReadReceiptRequest {
    private String messageUuid;
}
