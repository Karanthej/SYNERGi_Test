-- =============================================================================
-- SYNERGi / StartupHub — Complete Production Schema for Neon PostgreSQL
-- Generated from JPA entity audit (36 entities → 37 tables + 8 collection tables)
--
-- SAFE TO RUN ON AN EXISTING DATABASE:
--   • All CREATE TABLE statements use IF NOT EXISTS
--   • No DROP statements — existing data is never touched
--
-- Execution order respects FK dependencies (parents before children).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. USERS  (root entity)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id               BIGSERIAL PRIMARY KEY,
    uuid             UUID        NOT NULL UNIQUE,
    full_name        VARCHAR(100) NOT NULL,
    clerk_id         VARCHAR(100) UNIQUE,
    username         VARCHAR(20)  UNIQUE,
    email            VARCHAR(100) NOT NULL UNIQUE,
    password_hash    TEXT         NOT NULL,
    role             VARCHAR(20)  NOT NULL,
    account_status   VARCHAR(20)  NOT NULL,
    email_verified   BOOLEAN      NOT NULL DEFAULT FALSE,
    profile_image    TEXT,
    failed_login_attempts   INT  NOT NULL DEFAULT 0,
    account_locked_until    TIMESTAMP,
    last_login              TIMESTAMP,
    last_seen               TIMESTAMP,
    presence_status  VARCHAR(20)  DEFAULT 'ONLINE',
    created_at       TIMESTAMP    NOT NULL,
    updated_at       TIMESTAMP    NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_email     ON users (email);
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_uuid      ON users (uuid);
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_username  ON users (username);
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_clerk_id  ON users (clerk_id);
CREATE        INDEX IF NOT EXISTS idx_users_account_status ON users (account_status);
CREATE        INDEX IF NOT EXISTS idx_users_role           ON users (role);

-- ---------------------------------------------------------------------------
-- 2. USER PROFILES
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_profiles (
    id               BIGSERIAL PRIMARY KEY,
    user_id          BIGINT      NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    overview         TEXT,
    bio              TEXT,
    phone_number     VARCHAR(20),
    date_of_birth    DATE,
    gender           VARCHAR(20),
    country          VARCHAR(100),
    state            VARCHAR(100),
    city             VARCHAR(100),
    company_name     VARCHAR(150),
    startup_name     VARCHAR(150),
    website          TEXT,
    linkedin_url     TEXT,
    github_url       TEXT,
    portfolio_url    TEXT,
    resume_url       TEXT,
    cover_image_url  TEXT,
    created_at       TIMESTAMP    NOT NULL,
    updated_at       TIMESTAMP    NOT NULL
);

CREATE TABLE IF NOT EXISTS user_projects (
    user_profile_id  BIGINT NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    project          TEXT
);
CREATE INDEX IF NOT EXISTS idx_user_projects_profile ON user_projects (user_profile_id);

CREATE TABLE IF NOT EXISTS user_skills (
    user_profile_id  BIGINT NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    skill            VARCHAR(255)
);
CREATE INDEX IF NOT EXISTS idx_user_skills_profile ON user_skills (user_profile_id);

CREATE TABLE IF NOT EXISTS user_education (
    user_profile_id  BIGINT NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    education_entry  VARCHAR(255)
);
CREATE INDEX IF NOT EXISTS idx_user_education_profile ON user_education (user_profile_id);

CREATE TABLE IF NOT EXISTS user_experience (
    user_profile_id  BIGINT NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    experience_entry VARCHAR(255)
);
CREATE INDEX IF NOT EXISTS idx_user_experience_profile ON user_experience (user_profile_id);

-- ---------------------------------------------------------------------------
-- 3. PRIVACY SETTINGS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS privacy_settings (
    id                   BIGSERIAL PRIMARY KEY,
    user_id              BIGINT      NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    profile_visibility   VARCHAR(20) NOT NULL DEFAULT 'PUBLIC',
    contact_visibility   VARCHAR(20) NOT NULL DEFAULT 'CONNECTIONS',
    show_startup_profile BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at           TIMESTAMP   NOT NULL,
    updated_at           TIMESTAMP   NOT NULL
);

-- ---------------------------------------------------------------------------
-- 4. STARTUPS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS startups (
    id                   BIGSERIAL PRIMARY KEY,
    uuid                 UUID        NOT NULL UNIQUE,
    name                 VARCHAR(255) NOT NULL,
    logo_url             TEXT,
    cover_url            TEXT,
    tagline              TEXT,
    pitch                TEXT,
    problem_statement    TEXT,
    solution             TEXT,
    vision               TEXT,
    mission              TEXT,
    detailed_description TEXT,
    target_audience      TEXT,
    business_model       TEXT,
    revenue_model        TEXT,
    current_progress     TEXT,
    roadmap              TEXT,
    future_goals         TEXT,
    industry             VARCHAR(255),
    stage                VARCHAR(50),
    team_size            VARCHAR(50),
    expected_team_size   VARCHAR(50),
    max_members          INT          DEFAULT 10,
    timeline             VARCHAR(255),
    launch_goal          VARCHAR(255),
    commitment_type      VARCHAR(50),
    work_type            VARCHAR(50),
    city                 VARCHAR(255),
    equity_available     VARCHAR(100),
    equity_percentage    VARCHAR(100),
    status               VARCHAR(50)  NOT NULL DEFAULT 'DRAFT',
    is_deleted           BOOLEAN      NOT NULL DEFAULT FALSE,
    founder_id           BIGINT       NOT NULL REFERENCES users(id),
    created_at           TIMESTAMP    NOT NULL,
    updated_at           TIMESTAMP    NOT NULL,
    CONSTRAINT uq_startup_name_founder UNIQUE (name, founder_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_startup_uuid      ON startups (uuid);
CREATE        INDEX IF NOT EXISTS idx_startup_founder   ON startups (founder_id);
CREATE        INDEX IF NOT EXISTS idx_startup_status    ON startups (status);
CREATE        INDEX IF NOT EXISTS idx_startup_is_deleted ON startups (is_deleted);
CREATE        INDEX IF NOT EXISTS idx_startups_status_deleted ON startups (status, is_deleted);
CREATE        INDEX IF NOT EXISTS idx_startups_industry ON startups (industry);
CREATE        INDEX IF NOT EXISTS idx_startups_created_at ON startups (created_at);

-- ---------------------------------------------------------------------------
-- 5. STARTUP_ROLES
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS startup_roles (
    id         BIGSERIAL PRIMARY KEY,
    role_name  VARCHAR(255) NOT NULL,
    startup_id BIGINT       NOT NULL REFERENCES startups(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_startup_roles_startup ON startup_roles (startup_id);

-- ---------------------------------------------------------------------------
-- 6. STARTUP_SKILLS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS startup_skills (
    id         BIGSERIAL PRIMARY KEY,
    skill_name VARCHAR(255) NOT NULL,
    startup_id BIGINT       NOT NULL REFERENCES startups(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_startup_skills_startup ON startup_skills (startup_id);

-- ---------------------------------------------------------------------------
-- 7. STARTUP_ATTACHMENTS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS startup_attachments (
    id         BIGSERIAL PRIMARY KEY,
    type       VARCHAR(50)  NOT NULL,
    url        TEXT         NOT NULL,
    file_name  VARCHAR(255),
    startup_id BIGINT       NOT NULL REFERENCES startups(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_startup_attach_startup ON startup_attachments (startup_id);

-- ---------------------------------------------------------------------------
-- 8. STARTUP_APPLICATIONS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS startup_applications (
    id                          BIGSERIAL PRIMARY KEY,
    uuid                        UUID         NOT NULL UNIQUE,
    user_id                     BIGINT       NOT NULL REFERENCES users(id),
    startup_id                  BIGINT       NOT NULL REFERENCES startups(id),
    status                      VARCHAR(50)  NOT NULL DEFAULT 'PENDING',
    introduction                VARCHAR(1000),
    why_join                    VARCHAR(2000),
    why_right_fit               VARCHAR(2000),
    preferred_role              TEXT,
    years_experience            TEXT,
    current_occupation          TEXT,
    skills                      TEXT,
    technologies_known          TEXT,
    resume_url                  TEXT,
    portfolio_url               TEXT,
    github_url                  TEXT,
    linkedin_url                TEXT,
    personal_website_url        TEXT,
    hours_available             TEXT,
    preferred_working_style     TEXT,
    available_start_date        TEXT,
    previous_startup_experience TEXT,
    open_source_contributions   TEXT,
    achievements                TEXT,
    additional_notes            VARCHAR(2000),
    created_at                  TIMESTAMP    NOT NULL,
    updated_at                  TIMESTAMP,
    CONSTRAINT uq_application_user_startup UNIQUE (user_id, startup_id)
);

CREATE        INDEX IF NOT EXISTS idx_application_startup    ON startup_applications (startup_id);
CREATE        INDEX IF NOT EXISTS idx_application_status     ON startup_applications (status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_application_uuid       ON startup_applications (uuid);
CREATE        INDEX IF NOT EXISTS idx_applications_user_status ON startup_applications (user_id, status);

-- ---------------------------------------------------------------------------
-- 9. APPLICATION_STATUS_HISTORY
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS application_status_history (
    id                  BIGSERIAL PRIMARY KEY,
    application_id      BIGINT      NOT NULL REFERENCES startup_applications(id) ON DELETE CASCADE,
    status              VARCHAR(50) NOT NULL,
    changed_by_user_id  BIGINT      NOT NULL REFERENCES users(id),
    comments            VARCHAR(1000),
    changed_at          TIMESTAMP   NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_app_status_history_app ON application_status_history (application_id);

-- ---------------------------------------------------------------------------
-- 10. WORKSPACE_MEMBERS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS workspace_members (
    id         BIGSERIAL PRIMARY KEY,
    startup_id BIGINT      NOT NULL REFERENCES startups(id) ON DELETE CASCADE,
    user_id    BIGINT      NOT NULL REFERENCES users(id),
    role       VARCHAR(50) NOT NULL,
    status     VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    joined_at  TIMESTAMP   NOT NULL,
    updated_at TIMESTAMP,
    CONSTRAINT uq_workspace_member UNIQUE (startup_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_workspace_member_user    ON workspace_members (user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_member_startup ON workspace_members (startup_id);

-- ---------------------------------------------------------------------------
-- 11. CUSTOM_ROLES
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS custom_roles (
    id         BIGSERIAL PRIMARY KEY,
    uuid       UUID         NOT NULL UNIQUE,
    startup_id BIGINT       NOT NULL REFERENCES startups(id) ON DELETE CASCADE,
    name       VARCHAR(255) NOT NULL,
    created_at TIMESTAMP    NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_custom_roles_startup ON custom_roles (startup_id);

CREATE TABLE IF NOT EXISTS role_permissions (
    role_id    BIGINT       NOT NULL REFERENCES custom_roles(id) ON DELETE CASCADE,
    permission VARCHAR(255) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions (role_id);

-- ---------------------------------------------------------------------------
-- 12. JOB_OFFERS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS job_offers (
    id         BIGSERIAL PRIMARY KEY,
    uuid       UUID        NOT NULL UNIQUE,
    startup_id BIGINT      NOT NULL REFERENCES startups(id),
    founder_id BIGINT      NOT NULL REFERENCES users(id),
    talent_id  BIGINT      NOT NULL REFERENCES users(id),
    status     VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP   NOT NULL,
    updated_at TIMESTAMP
);
CREATE        INDEX IF NOT EXISTS idx_job_offer_startup ON job_offers (startup_id);
CREATE        INDEX IF NOT EXISTS idx_job_offer_founder ON job_offers (founder_id);
CREATE        INDEX IF NOT EXISTS idx_job_offer_talent  ON job_offers (talent_id);
CREATE        INDEX IF NOT EXISTS idx_job_offer_status  ON job_offers (status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_job_offer_uuid    ON job_offers (uuid);

-- ---------------------------------------------------------------------------
-- 13. ANNOUNCEMENTS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS announcements (
    id         BIGSERIAL PRIMARY KEY,
    uuid       UUID        NOT NULL UNIQUE,
    startup_id BIGINT      NOT NULL REFERENCES startups(id) ON DELETE CASCADE,
    author_id  BIGINT      NOT NULL REFERENCES users(id),
    title      VARCHAR(255) NOT NULL,
    content    TEXT         NOT NULL,
    priority   VARCHAR(20)  NOT NULL DEFAULT 'NORMAL',
    is_pinned  BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP    NOT NULL,
    updated_at TIMESTAMP    NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_announcements_startup ON announcements (startup_id);

-- ---------------------------------------------------------------------------
-- 14. STARTUP_BOOKMARKS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS startup_bookmarks (
    id         BIGSERIAL PRIMARY KEY,
    user_id    BIGINT    NOT NULL REFERENCES users(id),
    startup_id BIGINT    NOT NULL REFERENCES startups(id),
    created_at TIMESTAMP NOT NULL,
    CONSTRAINT uq_bookmark UNIQUE (user_id, startup_id)
);
CREATE INDEX IF NOT EXISTS idx_bookmark_user    ON startup_bookmarks (user_id);
CREATE INDEX IF NOT EXISTS idx_bookmark_startup ON startup_bookmarks (startup_id);

-- ---------------------------------------------------------------------------
-- 15. STARTUP_VIEWS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS startup_views (
    id         BIGSERIAL PRIMARY KEY,
    user_id    BIGINT    NOT NULL REFERENCES users(id),
    startup_id BIGINT    NOT NULL REFERENCES startups(id),
    created_at TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_startup_views_user_startup_time
    ON startup_views (user_id, startup_id, created_at);

-- ---------------------------------------------------------------------------
-- 16. WORKSPACE_TASKS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS workspace_tasks (
    id          BIGSERIAL PRIMARY KEY,
    uuid        UUID        NOT NULL UNIQUE,
    startup_id  BIGINT      NOT NULL REFERENCES startups(id) ON DELETE CASCADE,
    title       VARCHAR(255) NOT NULL,
    description TEXT,
    assignee_id BIGINT      REFERENCES users(id),
    reporter_id BIGINT      NOT NULL REFERENCES users(id),
    priority    VARCHAR(20)  NOT NULL,
    status      VARCHAR(20)  NOT NULL,
    due_date    TIMESTAMP,
    created_at  TIMESTAMP    NOT NULL,
    updated_at  TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_workspace_tasks_startup  ON workspace_tasks (startup_id);
CREATE INDEX IF NOT EXISTS idx_workspace_tasks_assignee ON workspace_tasks (assignee_id);
CREATE INDEX IF NOT EXISTS idx_workspace_tasks_reporter ON workspace_tasks (reporter_id);
CREATE INDEX IF NOT EXISTS idx_workspace_tasks_status   ON workspace_tasks (status);

-- ---------------------------------------------------------------------------
-- 17. WORKSPACE_CALENDAR_EVENTS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS workspace_calendar_events (
    id             BIGSERIAL PRIMARY KEY,
    uuid           UUID        NOT NULL UNIQUE,
    startup_id     BIGINT      NOT NULL REFERENCES startups(id) ON DELETE CASCADE,
    title          VARCHAR(255) NOT NULL,
    description    TEXT,
    start_date     TIMESTAMP    NOT NULL,
    end_date       TIMESTAMP    NOT NULL,
    created_by_id  BIGINT       NOT NULL REFERENCES users(id),
    created_at     TIMESTAMP    NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_cal_events_startup ON workspace_calendar_events (startup_id);

-- ---------------------------------------------------------------------------
-- 18. WORKSPACE_FILES
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS workspace_files (
    id           BIGSERIAL PRIMARY KEY,
    uuid         UUID         NOT NULL UNIQUE,
    startup_id   BIGINT       NOT NULL REFERENCES startups(id) ON DELETE CASCADE,
    uploader_id  BIGINT       NOT NULL REFERENCES users(id),
    file_name    VARCHAR(255) NOT NULL,
    file_url     TEXT         NOT NULL,
    file_type    VARCHAR(100) NOT NULL,
    file_size    BIGINT,
    folder_path  VARCHAR(500),
    created_at   TIMESTAMP    NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_workspace_files_startup  ON workspace_files (startup_id);
CREATE INDEX IF NOT EXISTS idx_workspace_files_uploader ON workspace_files (uploader_id);

-- ---------------------------------------------------------------------------
-- 19. WORKSPACE_ROADMAP_MILESTONES
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS workspace_roadmap_milestones (
    id          BIGSERIAL PRIMARY KEY,
    uuid        UUID         NOT NULL UNIQUE,
    startup_id  BIGINT       NOT NULL REFERENCES startups(id) ON DELETE CASCADE,
    title       VARCHAR(255) NOT NULL,
    description TEXT,
    due_date    TIMESTAMP,
    progress    INT          NOT NULL DEFAULT 0,
    created_at  TIMESTAMP    NOT NULL,
    updated_at  TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_roadmap_startup ON workspace_roadmap_milestones (startup_id);

-- ---------------------------------------------------------------------------
-- 20. WORKSPACE_ANNOUNCEMENTS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS workspace_announcements (
    id         BIGSERIAL PRIMARY KEY,
    uuid       UUID         NOT NULL UNIQUE,
    startup_id BIGINT       NOT NULL REFERENCES startups(id) ON DELETE CASCADE,
    author_id  BIGINT       NOT NULL REFERENCES users(id),
    title      VARCHAR(255) NOT NULL,
    content    TEXT         NOT NULL,
    pinned     BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP    NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_ws_announce_startup ON workspace_announcements (startup_id);

-- ---------------------------------------------------------------------------
-- 21. WORKSPACE_ACTIVITY_LOGS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS workspace_activity_logs (
    id          BIGSERIAL PRIMARY KEY,
    uuid        UUID         NOT NULL UNIQUE,
    startup_id  BIGINT       NOT NULL REFERENCES startups(id) ON DELETE CASCADE,
    actor_id    BIGINT       REFERENCES users(id),
    action_type VARCHAR(100) NOT NULL,
    description TEXT         NOT NULL,
    created_at  TIMESTAMP    NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_activity_log_startup ON workspace_activity_logs (startup_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_actor   ON workspace_activity_logs (actor_id);

-- ---------------------------------------------------------------------------
-- 22. CHAT_ROOMS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS chat_rooms (
    id          BIGSERIAL PRIMARY KEY,
    uuid        UUID         NOT NULL UNIQUE,
    startup_id  BIGINT       NOT NULL REFERENCES startups(id) ON DELETE CASCADE,
    type        VARCHAR(20)  NOT NULL,
    name        VARCHAR(255),
    description TEXT,
    icon_url    TEXT,
    color_theme VARCHAR(50),
    visibility  VARCHAR(30),
    is_archived BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMP,
    updated_at  TIMESTAMP
);
CREATE        INDEX IF NOT EXISTS idx_chat_room_startup ON chat_rooms (startup_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_chat_room_uuid    ON chat_rooms (uuid);

-- ---------------------------------------------------------------------------
-- 23. CHAT_SETTINGS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS chat_settings (
    id                BIGSERIAL PRIMARY KEY,
    room_id           BIGINT   NOT NULL UNIQUE REFERENCES chat_rooms(id) ON DELETE CASCADE,
    allow_attachments BOOLEAN  NOT NULL DEFAULT TRUE,
    allow_links       BOOLEAN  NOT NULL DEFAULT TRUE
);

-- ---------------------------------------------------------------------------
-- 24. CHAT_MEMBERS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS chat_members (
    id        BIGSERIAL PRIMARY KEY,
    room_id   BIGINT      NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
    user_id   BIGINT      NOT NULL REFERENCES users(id),
    role      VARCHAR(20) NOT NULL,
    joined_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_chat_member_room_id ON chat_members (room_id);
CREATE INDEX IF NOT EXISTS idx_chat_member_user_id ON chat_members (user_id);

-- ---------------------------------------------------------------------------
-- 25. CHAT_MESSAGES
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS chat_messages (
    id                  BIGSERIAL PRIMARY KEY,
    uuid                UUID    NOT NULL UNIQUE,
    room_id             BIGINT  NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
    sender_id           BIGINT  NOT NULL REFERENCES users(id),
    content             TEXT,
    reply_to_id         BIGINT  REFERENCES chat_messages(id),
    is_pinned           BOOLEAN NOT NULL DEFAULT FALSE,
    is_deleted          BOOLEAN NOT NULL DEFAULT FALSE,
    is_edited           BOOLEAN NOT NULL DEFAULT FALSE,
    is_voice_note       BOOLEAN NOT NULL DEFAULT FALSE,
    voice_note_duration INT,
    voice_note_waveform TEXT,
    created_at          TIMESTAMP,
    updated_at          TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_chat_msg_room_id    ON chat_messages (room_id);
CREATE INDEX IF NOT EXISTS idx_chat_msg_created_at ON chat_messages (created_at);
CREATE INDEX IF NOT EXISTS idx_chat_msg_sender     ON chat_messages (sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_uuid  ON chat_messages (uuid);
CREATE INDEX IF NOT EXISTS idx_chat_messages_pinned
    ON chat_messages (room_id, is_pinned) WHERE is_pinned = TRUE;

CREATE TABLE IF NOT EXISTS chat_message_deletions (
    message_id BIGINT NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
    user_id    BIGINT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_chat_msg_deletions_msg ON chat_message_deletions (message_id);

-- ---------------------------------------------------------------------------
-- 26. MESSAGE_ATTACHMENTS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS message_attachments (
    id         BIGSERIAL PRIMARY KEY,
    uuid       UUID         NOT NULL UNIQUE,
    message_id BIGINT       NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
    file_url   TEXT         NOT NULL,
    file_name  VARCHAR(255) NOT NULL,
    file_type  VARCHAR(100) NOT NULL,
    file_size  BIGINT,
    created_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_msg_attach_message_id ON message_attachments (message_id);

-- ---------------------------------------------------------------------------
-- 27. MESSAGE_REACTIONS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS message_reactions (
    id         BIGSERIAL PRIMARY KEY,
    message_id BIGINT      NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
    user_id    BIGINT      NOT NULL REFERENCES users(id),
    emoji      VARCHAR(50) NOT NULL,
    created_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_msg_reaction_message ON message_reactions (message_id);
CREATE INDEX IF NOT EXISTS idx_msg_reaction_user    ON message_reactions (user_id);

-- ---------------------------------------------------------------------------
-- 28. MESSAGE_READ_RECEIPTS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS message_read_receipts (
    id                   BIGSERIAL PRIMARY KEY,
    room_id              BIGINT    NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
    user_id              BIGINT    NOT NULL REFERENCES users(id),
    last_read_message_id BIGINT    NOT NULL REFERENCES chat_messages(id),
    read_at              TIMESTAMP NOT NULL,
    CONSTRAINT uq_read_receipt UNIQUE (room_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_read_receipt_room ON message_read_receipts (room_id);
CREATE INDEX IF NOT EXISTS idx_read_receipt_user ON message_read_receipts (user_id);

-- ---------------------------------------------------------------------------
-- 29. MESSAGE_STATUSES
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS message_statuses (
    id           BIGSERIAL PRIMARY KEY,
    message_id   BIGINT    NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
    user_id      BIGINT    NOT NULL REFERENCES users(id),
    delivered_at TIMESTAMP,
    read_at      TIMESTAMP,
    CONSTRAINT uq_message_status UNIQUE (message_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_message_status_message_id ON message_statuses (message_id);
CREATE INDEX IF NOT EXISTS idx_message_status_user_id    ON message_statuses (user_id);

-- ---------------------------------------------------------------------------
-- 30. CHAT_NOTIFICATIONS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS chat_notifications (
    id           BIGSERIAL PRIMARY KEY,
    uuid         UUID        NOT NULL UNIQUE,
    recipient_id BIGINT      NOT NULL REFERENCES users(id),
    sender_id    BIGINT      REFERENCES users(id),
    room_id      BIGINT      REFERENCES chat_rooms(id),
    startup_id   BIGINT      REFERENCES startups(id),
    message_id   BIGINT      REFERENCES chat_messages(id),
    type         VARCHAR(50) NOT NULL,
    content      TEXT,
    action_data  TEXT,
    is_read      BOOLEAN     NOT NULL DEFAULT FALSE,
    is_deleted   BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at   TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_chat_notif_recipient ON chat_notifications (recipient_id);
CREATE INDEX IF NOT EXISTS idx_chat_notif_room      ON chat_notifications (room_id);
CREATE INDEX IF NOT EXISTS idx_chat_notif_startup   ON chat_notifications (startup_id);
CREATE INDEX IF NOT EXISTS idx_chat_notifications_unread
    ON chat_notifications (recipient_id, is_read) WHERE is_read = FALSE;

-- ---------------------------------------------------------------------------
-- 31. MEETINGS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS meetings (
    id                   BIGSERIAL PRIMARY KEY,
    uuid                 UUID        NOT NULL UNIQUE,
    startup_id           BIGINT      NOT NULL REFERENCES startups(id) ON DELETE CASCADE,
    creator_id           BIGINT      NOT NULL REFERENCES users(id),
    title                VARCHAR(255) NOT NULL,
    description          TEXT,
    type                 VARCHAR(20)  NOT NULL,
    status               VARCHAR(20)  NOT NULL,
    scheduled_start_time TIMESTAMP,
    scheduled_end_time   TIMESTAMP,
    started_at           TIMESTAMP,
    ended_at             TIMESTAMP,
    created_at           TIMESTAMP,
    updated_at           TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_meeting_startup ON meetings (startup_id);
CREATE INDEX IF NOT EXISTS idx_meeting_creator ON meetings (creator_id);
CREATE INDEX IF NOT EXISTS idx_meeting_status  ON meetings (status);

-- ---------------------------------------------------------------------------
-- 32. MEETING_PARTICIPANTS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS meeting_participants (
    id         BIGSERIAL PRIMARY KEY,
    meeting_id BIGINT      NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    user_id    BIGINT      NOT NULL REFERENCES users(id),
    role       VARCHAR(20) NOT NULL,
    joined_at  TIMESTAMP,
    left_at    TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_meeting_participant_meeting ON meeting_participants (meeting_id);
CREATE INDEX IF NOT EXISTS idx_meeting_participant_user    ON meeting_participants (user_id);

-- ---------------------------------------------------------------------------
-- 33. MEETING_CHATS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS meeting_chats (
    id         BIGSERIAL PRIMARY KEY,
    uuid       UUID   NOT NULL UNIQUE,
    meeting_id BIGINT NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    sender_id  BIGINT NOT NULL REFERENCES users(id),
    content    TEXT   NOT NULL,
    created_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_meeting_chat_meeting ON meeting_chats (meeting_id);

-- ---------------------------------------------------------------------------
-- 34. CALL_LOGS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS call_logs (
    id               BIGSERIAL PRIMARY KEY,
    uuid             UUID        NOT NULL UNIQUE,
    caller_id        BIGINT      NOT NULL REFERENCES users(id),
    receiver_id      BIGINT      NOT NULL REFERENCES users(id),
    workspace_id     BIGINT      REFERENCES startups(id),
    status           VARCHAR(20) NOT NULL,
    duration_seconds INT,
    started_at       TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_call_log_caller    ON call_logs (caller_id);
CREATE INDEX IF NOT EXISTS idx_call_log_receiver  ON call_logs (receiver_id);
CREATE INDEX IF NOT EXISTS idx_call_log_workspace ON call_logs (workspace_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_started_at ON call_logs (started_at);

CREATE TABLE IF NOT EXISTS call_log_deletions (
    call_id BIGINT NOT NULL REFERENCES call_logs(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_call_deletions_call ON call_log_deletions (call_id);

-- ---------------------------------------------------------------------------
-- 35. CALL_ANALYTICS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS call_analytics (
    id                         BIGSERIAL PRIMARY KEY,
    call_log_id                BIGINT           NOT NULL UNIQUE REFERENCES call_logs(id) ON DELETE CASCADE,
    average_rtt                DOUBLE PRECISION,
    max_rtt                    DOUBLE PRECISION,
    average_jitter             DOUBLE PRECISION,
    max_jitter                 DOUBLE PRECISION,
    average_packet_loss        DOUBLE PRECISION,
    max_packet_loss            DOUBLE PRECISION,
    average_bitrate            DOUBLE PRECISION,
    min_bitrate                DOUBLE PRECISION,
    max_bitrate                DOUBLE PRECISION,
    ice_restarts               INT,
    reconnections              INT,
    turn_used                  BOOLEAN,
    stun_used                  BOOLEAN,
    selected_candidate_type    VARCHAR(50),
    mute_count                 INT,
    device_changes             INT,
    audio_constraint_supported BOOLEAN,
    mic_permission_failures    INT,
    browser                    VARCHAR(100),
    os                         VARCHAR(100),
    cpu_usage                  DOUBLE PRECISION,
    memory_usage               DOUBLE PRECISION
);

-- =============================================================================
-- VERIFICATION QUERIES (run manually after execution)
-- =============================================================================
-- SELECT table_name FROM information_schema.tables
--   WHERE table_schema = 'public' ORDER BY table_name;
--
-- SELECT COUNT(*) FROM information_schema.tables
--   WHERE table_schema = 'public';   -- expected: 45 (37 main + 8 collection tables)
