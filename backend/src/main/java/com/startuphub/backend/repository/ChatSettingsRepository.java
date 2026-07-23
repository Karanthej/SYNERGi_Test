package com.startuphub.backend.repository;

import com.startuphub.backend.entity.chat.ChatRoom;
import com.startuphub.backend.entity.chat.ChatSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ChatSettingsRepository extends JpaRepository<ChatSettings, Long> {
    Optional<ChatSettings> findByRoom(ChatRoom room);
}
