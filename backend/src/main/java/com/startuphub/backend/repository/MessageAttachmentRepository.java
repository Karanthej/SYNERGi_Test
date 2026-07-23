package com.startuphub.backend.repository;

import com.startuphub.backend.entity.chat.ChatRoom;
import com.startuphub.backend.entity.chat.MessageAttachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MessageAttachmentRepository extends JpaRepository<MessageAttachment, Long> {
    Optional<MessageAttachment> findByUuid(UUID uuid);

    @Query("SELECT ma FROM MessageAttachment ma WHERE ma.message.room = :room ORDER BY ma.createdAt DESC")
    List<MessageAttachment> findByRoomOrderByCreatedAtDesc(@Param("room") ChatRoom room);

    @org.springframework.data.jpa.repository.Modifying
    @Query("DELETE FROM MessageAttachment ma WHERE ma.message.room = :room")
    void deleteByRoom(@Param("room") ChatRoom room);
}
