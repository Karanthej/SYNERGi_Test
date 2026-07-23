package com.startuphub.backend.entity.enums;

public enum CallState {
    IDLE,
    INITIATED,
    RINGING,
    WAITING,
    ACCEPTED,
    CONNECTING,
    NEGOTIATING,
    ICE_GATHERING,
    ICE_CONNECTED,
    CONNECTED,
    ON_HOLD,
    MUTED,
    RECONNECTING,
    BUSY,
    REJECTED,
    CANCELLED,
    FAILED,
    TIMEOUT,
    ENDED,
    MISSED
}
