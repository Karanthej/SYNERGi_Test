package com.startuphub.backend.config;

import jakarta.annotation.PostConstruct;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Configuration
@RequiredArgsConstructor
@Slf4j
public class DatabaseMigrationConfig {

    private final JdbcTemplate jdbcTemplate;

    @PostConstruct
    public void migrateColumns() {
        try {
            log.info("Migrating pitch and tagline to TEXT...");
            jdbcTemplate.execute("ALTER TABLE startups ALTER COLUMN pitch TYPE TEXT;");
            jdbcTemplate.execute("ALTER TABLE startups ALTER COLUMN tagline TYPE TEXT;");
            log.info("Migration successful.");
        } catch (Exception e) {
            log.warn("Migration failed or already applied: " + e.getMessage());
        }
    }
}
