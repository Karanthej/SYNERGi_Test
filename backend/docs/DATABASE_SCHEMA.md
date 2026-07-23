# Database Schema Overview

SYNERGi relies on a deeply relational model powered by PostgreSQL.

## Core Entities
- **users:** Stores authentication, profile data, and global role.
- **startups:** Stores startup pitch data, visibility status, and links to the Founder.
- **applications:** Join table capturing a Talent's application to a Startup, including motivation/cover letter.
- **workspace_members:** Links accepted users to a Startup's private collaboration space.

## Workspace Entities (Strictly isolated by startup_id)
- **chat_channels:** General, PM, and custom group channels per workspace.
- **chat_messages:** The payloads inside channels.
- **workspace_tasks:** Kanban-style task management (TODO, IN_PROGRESS, DONE).
- **workspace_files:** File metadata and URIs pointing to actual storage.
- **calendar_events:** Team meetings and deadlines.
- **activity_logs:** Audit trailing of major actions within the workspace.

## Indexing Strategy
To optimize query performance, indexes are explicitly placed on:
- `users(email)`
- `startups(name, status, founder_id)`
- `workspace_tasks(startup_id, assignee_id)`
- `chat_messages(channel_id, created_at)`
