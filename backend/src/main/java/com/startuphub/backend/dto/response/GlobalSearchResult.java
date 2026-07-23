package com.startuphub.backend.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class GlobalSearchResult {
    private String id; // UUID
    private String type; // "STARTUP", "USER", "TASK", "FILE"
    private String title;
    private String subtitle;
    private String url;
}
