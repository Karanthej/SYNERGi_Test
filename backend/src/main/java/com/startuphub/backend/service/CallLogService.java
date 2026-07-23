package com.startuphub.backend.service;

import com.startuphub.backend.dto.request.CallLogRequest;
import com.startuphub.backend.dto.response.CallLogResponse;
import com.startuphub.backend.entity.CallLog;
import com.startuphub.backend.entity.User;
import com.startuphub.backend.entity.Startup;
import com.startuphub.backend.repository.CallLogRepository;
import com.startuphub.backend.repository.UserRepository;
import com.startuphub.backend.repository.StartupRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CallLogService {

    private final CallLogRepository callLogRepository;
    private final UserRepository userRepository;
    private final StartupRepository startupRepository;

    public CallLogResponse logCall(UUID workspaceId, CallLogRequest request) {
        Startup workspace = startupRepository.findByUuid(workspaceId)
                .orElseThrow(() -> new RuntimeException("Workspace not found"));
        User caller = userRepository.findByUuid(request.getCallerId())
                .orElseThrow(() -> new RuntimeException("Caller not found"));
        User receiver = userRepository.findByUuid(request.getReceiverId())
                .orElseThrow(() -> new RuntimeException("Receiver not found"));

        CallLog callLog = CallLog.builder()
                .uuid(request.getUuid())
                .workspace(workspace)
                .caller(caller)
                .receiver(receiver)
                .status(request.getStatus())
                .durationSeconds(request.getDurationSeconds())
                .build();

        CallLog saved = callLogRepository.save(callLog);
        return mapToResponse(saved);
    }

    public com.startuphub.backend.entity.CallAnalytics saveAnalytics(UUID callId, com.startuphub.backend.dto.request.CallAnalyticsDto dto) {
        CallLog callLog = callLogRepository.findAll().stream()
                .filter(c -> c.getUuid().equals(callId))
                .findFirst()
                .orElse(null);

        if (callLog == null) {
            return null; // Gracefully handle if call log was not saved
        }
        
        com.startuphub.backend.entity.CallAnalytics analytics = callLog.getAnalytics();
        if (analytics == null) {
            analytics = new com.startuphub.backend.entity.CallAnalytics();
            analytics.setCallLog(callLog);
        }
        
        analytics.setAverageRtt(dto.getAverageRtt());
        analytics.setMaxRtt(dto.getMaxRtt());
        analytics.setAverageJitter(dto.getAverageJitter());
        analytics.setMaxJitter(dto.getMaxJitter());
        analytics.setAveragePacketLoss(dto.getAveragePacketLoss());
        analytics.setMaxPacketLoss(dto.getMaxPacketLoss());
        analytics.setAverageBitrate(dto.getAverageBitrate());
        analytics.setMinBitrate(dto.getMinBitrate());
        analytics.setMaxBitrate(dto.getMaxBitrate());
        analytics.setIceRestarts(dto.getIceRestarts());
        analytics.setReconnections(dto.getReconnections());
        analytics.setTurnUsed(dto.getTurnUsed());
        analytics.setStunUsed(dto.getStunUsed());
        analytics.setSelectedCandidateType(dto.getSelectedCandidateType());
        analytics.setMuteCount(dto.getMuteCount());
        analytics.setDeviceChanges(dto.getDeviceChanges());
        analytics.setAudioConstraintSupported(dto.getAudioConstraintSupported());
        analytics.setMicPermissionFailures(dto.getMicPermissionFailures());
        analytics.setBrowser(dto.getBrowser());
        analytics.setOs(dto.getOs());
        analytics.setCpuUsage(dto.getCpuUsage());
        analytics.setMemoryUsage(dto.getMemoryUsage());
        
        if (callLog.getAnalytics() == null) {
            callLog.setAnalytics(analytics);
        }
        callLogRepository.save(callLog);
        return analytics;
    }

    public List<CallLogResponse> getCallHistory(UUID workspaceId, UUID user1Id, UUID user2Id) {
        Startup workspace = startupRepository.findByUuid(workspaceId)
                .orElseThrow(() -> new RuntimeException("Workspace not found"));
        User user1 = userRepository.findByUuid(user1Id)
                .orElseThrow(() -> new RuntimeException("User1 not found"));
        User user2 = userRepository.findByUuid(user2Id)
                .orElseThrow(() -> new RuntimeException("User2 not found"));

        List<CallLog> logs = callLogRepository.findCallHistoryBetweenUsers(workspace, user1, user2);
        return logs.stream().map(log -> mapToResponse(log, user1)).collect(Collectors.toList());
    }

    @org.springframework.transaction.annotation.Transactional
    public void clearCallLogsForUser(Startup workspace, User user1, User user2, User currentUser) {
        callLogRepository.clearCallLogsForUser(workspace.getId(), user1.getId(), user2.getId(), currentUser.getId());
    }

    private CallLogResponse mapToResponse(CallLog callLog) {
        return mapToResponse(callLog, null);
    }

    private CallLogResponse mapToResponse(CallLog callLog, User currentUser) {
        com.startuphub.backend.dto.response.CallLogResponse response = CallLogResponse.builder()
                .uuid(callLog.getUuid())
                .callerId(callLog.getCaller().getUuid())
                .receiverId(callLog.getReceiver().getUuid())
                .status(callLog.getStatus())
                .durationSeconds(callLog.getDurationSeconds())
                .startedAt(callLog.getStartedAt())
                .isDeletedForMe(currentUser != null && callLog.getDeletedByUsers() != null && callLog.getDeletedByUsers().contains(currentUser.getId()))
                .build();
                
        if (callLog.getAnalytics() != null) {
            com.startuphub.backend.dto.request.CallAnalyticsDto dto = new com.startuphub.backend.dto.request.CallAnalyticsDto();
            com.startuphub.backend.entity.CallAnalytics entity = callLog.getAnalytics();
            dto.setAverageRtt(entity.getAverageRtt());
            dto.setMaxRtt(entity.getMaxRtt());
            dto.setAverageJitter(entity.getAverageJitter());
            dto.setMaxJitter(entity.getMaxJitter());
            dto.setAveragePacketLoss(entity.getAveragePacketLoss());
            dto.setMaxPacketLoss(entity.getMaxPacketLoss());
            dto.setAverageBitrate(entity.getAverageBitrate());
            dto.setMinBitrate(entity.getMinBitrate());
            dto.setMaxBitrate(entity.getMaxBitrate());
            dto.setIceRestarts(entity.getIceRestarts());
            dto.setReconnections(entity.getReconnections());
            dto.setTurnUsed(entity.getTurnUsed());
            dto.setStunUsed(entity.getStunUsed());
            dto.setSelectedCandidateType(entity.getSelectedCandidateType());
            dto.setMuteCount(entity.getMuteCount());
            dto.setDeviceChanges(entity.getDeviceChanges());
            dto.setAudioConstraintSupported(entity.getAudioConstraintSupported());
            dto.setMicPermissionFailures(entity.getMicPermissionFailures());
            dto.setBrowser(entity.getBrowser());
            dto.setOs(entity.getOs());
            dto.setCpuUsage(entity.getCpuUsage());
            dto.setMemoryUsage(entity.getMemoryUsage());
            response.setAnalytics(dto);
        }
        return response;
    }

    public List<CallLogResponse> getWorkspaceCalls(UUID workspaceId) {
        Startup workspace = startupRepository.findByUuid(workspaceId)
                .orElseThrow(() -> new RuntimeException("Workspace not found"));
        List<CallLog> logs = callLogRepository.findByWorkspaceOrderByStartedAtDesc(workspace);
        return logs.stream().map(this::mapToResponse).collect(Collectors.toList());
    }
}

