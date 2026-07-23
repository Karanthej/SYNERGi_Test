package com.startuphub.backend.repository;

import com.startuphub.backend.entity.User;
import com.startuphub.backend.entity.chat.ChatNotification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface ChatNotificationRepository extends JpaRepository<ChatNotification, Long> {
    List<ChatNotification> findByRecipientAndIsDeletedFalseOrderByCreatedAtDesc(User recipient);
    
    List<ChatNotification> findByRecipientAndTypeAndActionData(User recipient, com.startuphub.backend.entity.enums.ChatNotificationType type, String actionData);
    
    long countByRecipientAndIsReadFalseAndIsDeletedFalse(User recipient);
    
    @Modifying(clearAutomatically = true)
    @Query("UPDATE ChatNotification n SET n.isRead = true WHERE n.recipient = :recipient AND n.isDeleted = false")
    void markAllAsRead(@Param("recipient") User recipient);

    @Modifying(clearAutomatically = true)
    @Query("UPDATE ChatNotification n SET n.isRead = true WHERE n.recipient = :recipient AND n.uuid = :uuid")
    void markAsRead(@Param("recipient") User recipient, @Param("uuid") UUID uuid);
}
