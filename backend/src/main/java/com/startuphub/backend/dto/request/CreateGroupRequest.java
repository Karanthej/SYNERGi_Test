package com.startuphub.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import java.util.List;
import java.util.UUID;

@Data
public class CreateGroupRequest {
    @NotBlank
    private String name;
    private String description;
    private List<UUID> memberUuids;
}
