package com.startuphub.backend.dto.request;

import lombok.Data;
import java.util.List;
import java.util.UUID;

@Data
public class GroupRequest {
    private String name;
    private String description;
    private Boolean isArchived;
    private List<UUID> memberUuids;
}
