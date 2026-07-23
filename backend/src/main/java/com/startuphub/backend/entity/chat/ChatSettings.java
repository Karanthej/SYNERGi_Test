package com.startuphub.backend.entity.chat;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "chat_settings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatSettings {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", nullable = false, unique = true)
    private ChatRoom room;

    @Column(name = "allow_attachments", nullable = false)
    @Builder.Default
    private boolean allowAttachments = true;

    @Column(name = "allow_links", nullable = false)
    @Builder.Default
    private boolean allowLinks = true;
}
