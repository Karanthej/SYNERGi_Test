package com.startuphub.backend.dto.response;

import lombok.Builder;
import lombok.Data;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class ChatMessageResponse {
    private String uuid;
    private String tempUuid;
    private String content;
    private String senderUuid;
    private String senderName;
    private String senderUsername;
    private String senderAvatarUrl;
    private String senderRole;

    @JsonProperty("isPinned")
    private boolean isPinned;
    @JsonProperty("isDeleted")
    private boolean isDeleted;
    @JsonProperty("isDeletedForMe")
    private boolean isDeletedForMe;
    @JsonProperty("isEdited")
    private boolean isEdited;
    @JsonProperty("isVoiceNote")
    private boolean isVoiceNote;
    private Integer voiceNoteDuration;
    private String voiceNoteWaveform;
    private LocalDateTime createdAt;
    
    // Replying
    private String replyToMessageUuid;
    private String replyToContent;
    private String replyToSenderName;
    private String replyToSenderUsername;
    
    // Reactions
    private List<ReactionResponse> reactions;
    
    // Attachments
    private List<AttachmentResponse> attachments;
    private List<MessageStatusResponse> statuses;
}
