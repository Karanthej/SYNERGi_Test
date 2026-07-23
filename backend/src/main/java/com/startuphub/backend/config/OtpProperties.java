package com.startuphub.backend.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Data
@Configuration
@ConfigurationProperties(prefix = "app.otp")
public class OtpProperties {
    
    /** Expiration time in minutes */
    private int expiryMinutes = 5;
    
    /** Maximum allowed attempts per OTP */
    private int maxAttempts = 3;
    
    /** Time in days to keep used or expired OTPs before cleanup */
    private int retentionDays = 1;
}
