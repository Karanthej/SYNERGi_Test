package com.startuphub.backend.repository;

import com.startuphub.backend.entity.CallAnalytics;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CallAnalyticsRepository extends JpaRepository<CallAnalytics, Long> {
}
