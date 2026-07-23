package com.startuphub.backend.repository;

import com.startuphub.backend.entity.CallLog;
import com.startuphub.backend.entity.User;
import com.startuphub.backend.entity.Startup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CallLogRepository extends JpaRepository<CallLog, Long> {

    @Query("SELECT c FROM CallLog c WHERE c.workspace = :workspace AND ((c.caller = :user1 AND c.receiver = :user2) OR (c.caller = :user2 AND c.receiver = :user1)) ORDER BY c.startedAt DESC")
    List<CallLog> findCallHistoryBetweenUsers(
            @Param("workspace") Startup workspace, 
            @Param("user1") User user1, 
            @Param("user2") User user2
    );

    List<CallLog> findByWorkspaceOrderByStartedAtDesc(Startup workspace);

    @org.springframework.data.jpa.repository.Modifying
    @Query(value = "INSERT INTO call_log_deletions (call_id, user_id) SELECT id, :userId FROM call_logs WHERE workspace_id = :workspaceId AND ((caller_id = :user1Id AND receiver_id = :user2Id) OR (caller_id = :user2Id AND receiver_id = :user1Id)) ON CONFLICT DO NOTHING", nativeQuery = true)
    void clearCallLogsForUser(@Param("workspaceId") Long workspaceId, @Param("user1Id") Long user1Id, @Param("user2Id") Long user2Id, @Param("userId") Long userId);
}

