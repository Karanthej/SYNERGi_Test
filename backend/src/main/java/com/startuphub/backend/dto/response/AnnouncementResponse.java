package com.startuphub.backend.dto.response;

import com.startuphub.backend.entity.Announcement;
import com.startuphub.backend.entity.enums.AnnouncementPriority;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class AnnouncementResponse {
    private String uuid;
    private String title;
    private String content;
    private AnnouncementPriority priority;
    private boolean isPinned;
    private LocalDateTime createdAt;
    
    // Author details
    private String authorUuid;
    private String authorName;
    private String authorRole; // We can set this to the user's role or workspace role
    private String authorAvatar;

    public static AnnouncementResponse fromEntity(Announcement announcement, String authorRole) {
        return AnnouncementResponse.builder()
                .uuid(announcement.getUuid().toString())
                .title(announcement.getTitle())
                .content(announcement.getContent())
                .priority(announcement.getPriority())
                .isPinned(announcement.isPinned())
                .createdAt(announcement.getCreatedAt())
                .authorUuid(announcement.getAuthor().getUuid().toString())
                .authorName(announcement.getAuthor().getFullName())
                .authorRole(authorRole)
                .authorAvatar(announcement.getAuthor().getProfileImage())
                .build();
    }
}
