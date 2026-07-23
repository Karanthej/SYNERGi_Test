package com.startuphub.backend.dto.response;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder
public class TalentDashboardAnalyticsResponse {
    private int applicationsSubmitted;
    private int acceptedStartups;
    private int assignedTasks;
    private int upcomingMeetings;
    private List<TaskResponse> recentTasks;
}
