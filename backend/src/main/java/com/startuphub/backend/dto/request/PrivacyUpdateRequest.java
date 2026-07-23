package com.startuphub.backend.dto.request;

import lombok.Data;

@Data
public class PrivacyUpdateRequest {
    private String profileVisibility;
    private String contactVisibility;
    private boolean showStartupProfile;
}
