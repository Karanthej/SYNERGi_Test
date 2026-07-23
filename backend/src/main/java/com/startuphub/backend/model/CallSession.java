package com.startuphub.backend.model;

import com.startuphub.backend.entity.enums.CallState;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
public class CallSession {
    private UUID callId;
    private UUID callerId;
    private UUID receiverId;
    private UUID workspaceId;
    private CallState state;
    private Instant createdAt;
    private Instant acceptedAt;
    private Instant endedAt;

    public CallSession(UUID callId, UUID callerId, UUID receiverId, UUID workspaceId) {
        this.callId = callId;
        this.callerId = callerId;
        this.receiverId = receiverId;
        this.workspaceId = workspaceId;
        this.state = CallState.INITIATED;
        this.createdAt = Instant.now();
    }
}
