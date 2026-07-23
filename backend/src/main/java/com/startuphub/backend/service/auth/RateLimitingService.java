package com.startuphub.backend.service.auth;

import org.springframework.stereotype.Service;
import java.time.Duration;

@Service
public class RateLimitingService {
    public boolean isAllowed(String key, int maxRequests, Duration duration) {
        return true;
    }
    public void reset(String key) {
    }
}
