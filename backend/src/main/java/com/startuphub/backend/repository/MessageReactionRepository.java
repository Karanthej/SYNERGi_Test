package com.startuphub.backend.repository;

import com.startuphub.backend.entity.User;
import com.startuphub.backend.entity.chat.ChatMessage;
import com.startuphub.backend.entity.chat.MessageReaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MessageReactionRepository extends JpaRepository<MessageReaction, Long> {
    List<MessageReaction> findByMessage(ChatMessage message);
    List<MessageReaction> findByMessageIn(List<ChatMessage> messages);
    Optional<MessageReaction> findByMessageAndUserAndEmoji(ChatMessage message, User user, String emoji);
    
    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("DELETE FROM MessageReaction mr WHERE mr.message.room = :room")
    void deleteByRoom(@org.springframework.data.repository.query.Param("room") com.startuphub.backend.entity.chat.ChatRoom room);
}
