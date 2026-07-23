package com.startuphub.backend.dto.request;

import lombok.Data;

@Data
public class ActivityRequest {
    private String type; // TYPING, RECORDING, UPLOADING, NONE
}
