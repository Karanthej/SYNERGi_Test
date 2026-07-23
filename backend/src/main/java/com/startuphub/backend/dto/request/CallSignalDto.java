package com.startuphub.backend.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CallSignalDto {
    private String type; // OFFER, ANSWER, ICE_CANDIDATE, CALL_REQUEST, CALL_ACCEPT, CALL_REJECT, CALL_END
    private UUID callId; // Unique identifier for the call session
    private String state; // The current or requested CallState
    private UUID callerId;
    private UUID receiverId;
    private String payload; // JSON string containing SDP or ICE candidate data
    private UUID workspaceId;
    private String callerName;
    private String callerUsername;
    private String callerProfileUrl;
    private String callerWorkspaceName;
}

