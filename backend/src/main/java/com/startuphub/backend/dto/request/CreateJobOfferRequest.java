package com.startuphub.backend.dto.request;

import lombok.Data;
import java.util.List;

@Data
public class CreateJobOfferRequest {
    private String talentUuid;
    private List<String> startupUuids;
}
