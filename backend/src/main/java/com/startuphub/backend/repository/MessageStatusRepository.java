package com.startuphub.backend.repository;

import com.startuphub.backend.entity.User;
import com.startuphub.backend.entity.chat.ChatMessage;
import com.startuphub.backend.entity.chat.MessageStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MessageStatusRepository extends JpaRepository<MessageStatus, Long> {
    Optional<MessageStatus> findByMessageAndUser(ChatMessage message, User user);
    List<MessageStatus> findByMessage(ChatMessage message);
    List<MessageStatus> findByMessageIn(List<ChatMessage> messages);
}
