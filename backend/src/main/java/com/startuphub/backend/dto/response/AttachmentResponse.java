package com.startuphub.backend.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AttachmentResponse {
    private String uuid;
    private String fileUrl; // API URL to download/view
    private String fileName;
    private String fileType;
    private Long fileSize;
}
