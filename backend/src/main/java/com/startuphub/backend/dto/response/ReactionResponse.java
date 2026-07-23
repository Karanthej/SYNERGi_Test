package com.startuphub.backend.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class ReactionResponse {
    private String emoji;
    private int count;
    private List<String> userUuids;
}
