package com.startuphub.backend.dto.request;

import lombok.Data;

@Data
public class UpdatePresenceRequest {
    private String status; // ONLINE, BUSY
}
