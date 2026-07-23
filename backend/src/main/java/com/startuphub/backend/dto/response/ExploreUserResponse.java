package com.startuphub.backend.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class ExploreUserResponse {
    private String uuid;
    private String fullName;
    private String username;
    private String role;
    private String profileImage;
    private String bio;
    private String city;
    private String country;
    private List<String> skills;
}
