package com.startuphub.backend.dto.request;

import lombok.Data;

@Data
public class PreferencesUpdateRequest {
    private boolean applicationAlerts;
    private boolean interviewAlerts;
    private boolean meetingAlerts;
    private boolean messages;
    private boolean chat;
    private boolean teamRequests;
    private boolean recommendations;
    private boolean emailNotifications;
    private boolean pushNotifications;
    private boolean smsNotifications;
    private boolean sound;
    private boolean desktopNotifications;
}
