package com.startuphub.backend.repository;

import com.startuphub.backend.entity.chat.ChatRoom;
import com.startuphub.backend.entity.chat.ChatMessage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.time.LocalDateTime;
import com.startuphub.backend.entity.User;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"sender"})
    Page<ChatMessage> findByRoomAndDeletedFalseOrderByCreatedAtDesc(ChatRoom room, Pageable pageable);
    Optional<ChatMessage> findTopByRoomOrderByCreatedAtDesc(ChatRoom room);
    List<ChatMessage> findByRoom(ChatRoom room);
    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"sender"})
    Page<ChatMessage> findByRoomAndContentContainingIgnoreCaseAndDeletedFalseOrderByCreatedAtDesc(ChatRoom room, String content, Pageable pageable);
    
    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"sender"})
    @org.springframework.data.jpa.repository.Query("SELECT m FROM ChatMessage m LEFT JOIN m.attachments a WHERE m.room = :room AND m.deleted = false AND (a.fileType LIKE 'image/%' OR a.fileType LIKE 'video/%') ORDER BY m.createdAt DESC")
    Page<ChatMessage> findMediaByRoom(@org.springframework.data.repository.query.Param("room") ChatRoom room, Pageable pageable);
    
    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"sender"})
    @org.springframework.data.jpa.repository.Query("SELECT m FROM ChatMessage m LEFT JOIN m.attachments a WHERE m.room = :room AND m.deleted = false AND a.fileType NOT LIKE 'image/%' AND a.fileType NOT LIKE 'video/%' ORDER BY m.createdAt DESC")
    Page<ChatMessage> findDocumentsByRoom(@org.springframework.data.repository.query.Param("room") ChatRoom room, Pageable pageable);

    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"sender"})
    @org.springframework.data.jpa.repository.Query("SELECT m FROM ChatMessage m WHERE m.room = :room AND m.deleted = false AND (m.content LIKE '%http://%' OR m.content LIKE '%https://%') ORDER BY m.createdAt DESC")
    Page<ChatMessage> findLinksByRoom(@org.springframework.data.repository.query.Param("room") ChatRoom room, Pageable pageable);

    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"sender"})
    @org.springframework.data.jpa.repository.Query("SELECT m FROM ChatMessage m WHERE m.room = :room AND m.deleted = false AND m.pinned = true ORDER BY m.createdAt DESC")
    Page<ChatMessage> findPinnedByRoom(@org.springframework.data.repository.query.Param("room") ChatRoom room, Pageable pageable);

    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"sender"})
    @org.springframework.data.jpa.repository.Query("SELECT m FROM ChatMessage m WHERE m.room = :room AND m.deleted = false AND m.replyTo IS NOT NULL ORDER BY m.createdAt DESC")
    Page<ChatMessage> findRepliesByRoom(@org.springframework.data.repository.query.Param("room") ChatRoom room, Pageable pageable);

    Optional<ChatMessage> findByUuid(UUID uuid);
    
    long countByRoomAndSenderNotAndCreatedAtAfter(ChatRoom room, User sender, LocalDateTime createdAt);
    long countByRoomAndSenderNot(ChatRoom room, User sender);
    
    @org.springframework.data.jpa.repository.Query("SELECT m FROM ChatMessage m WHERE m.room = :room AND m.sender != :sender AND m.createdAt > :createdAt AND m.deleted = false ORDER BY m.createdAt DESC")
    java.util.List<ChatMessage> findUnreadMessages(ChatRoom room, User sender, LocalDateTime createdAt);
    
    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("DELETE FROM ChatMessage m WHERE m.room = :room")
    void deleteByRoom(@org.springframework.data.repository.query.Param("room") ChatRoom room);
    
    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query(value = "DELETE FROM chat_message_deletions WHERE message_id IN (SELECT id FROM chat_messages WHERE room_id = :roomId)", nativeQuery = true)
    void deleteDeletionsByRoomId(@org.springframework.data.repository.query.Param("roomId") Long roomId);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query(value = "INSERT INTO chat_message_deletions (message_id, user_id) SELECT id, :userId FROM chat_messages WHERE room_id = :roomId ON CONFLICT DO NOTHING", nativeQuery = true)
    void clearChatForUser(@org.springframework.data.repository.query.Param("roomId") Long roomId, @org.springframework.data.repository.query.Param("userId") Long userId);
}
