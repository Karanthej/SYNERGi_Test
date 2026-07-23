package com.startuphub.backend.dto.response;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder
public class DashboardOverviewResponse {
    private String startupName;
    private String tagline;
    private String stage;
    private String logoUrl;
    private int activeTaskCount;
    private int teamMemberCount;
    private int upcomingMeetings;
    private List<TaskResponse> recentTasks;
    // other recent items
}
