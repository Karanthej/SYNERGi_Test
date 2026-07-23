package com.startuphub.backend.dto.response;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder
public class FounderDashboardAnalyticsResponse {
    private int totalStartups;
    private int publishedStartups;
    private int activeTeamMembers;
    private int pendingApplications;
    private int acceptedApplications;
    private List<TaskResponse> recentTasks;
}
