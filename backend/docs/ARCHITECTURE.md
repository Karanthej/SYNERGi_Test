# SYNERGi Architecture & System Overview

## Core Architecture
SYNERGi uses a split architecture:
1. **Frontend:** React + Vite SPA using TailwindCSS and Zustand for state.
2. **Backend:** Spring Boot (Java) providing RESTful JSON APIs.
3. **Database:** PostgreSQL (via Neon) serving as the relational backbone using Hibernate/JPA.
4. **Real-time:** WebSockets with STOMP for chat and a custom WebRTC signaling server for video meetings.

## Collaboration Space Isolation
Each Startup in SYNERGi functions as an independent tenant once a Talent is accepted.
- A `Startup` entity forms the root of a Workspace.
- `WorkspaceMember` links `User`s to a `Startup` with a specific `CustomRole` (e.g., FOUNDER, TALENT).
- All workspace-specific entities (`WorkspaceTask`, `WorkspaceFile`, `WorkspaceAnnouncement`, `ChatChannel`, `CalendarEvent`) possess a strictly enforced `startup_id` foreign key.
- The APIs use `@PreAuthorize` combined with a backend logic check to ensure a user requesting data for `/api/v1/workspaces/{id}/*` is an active `WorkspaceMember` for that `{id}`.

## Security Model
- **Authentication:** JWT (JSON Web Tokens) are generated upon successful login/OTP verification. They expire after 24 hours.
- **Role-Based Access Control (RBAC):** Users are assigned global roles (`FOUNDER`, `TALENT`) and workspace-specific roles.
- **Passwords:** Handled via Spring Security's `BCryptPasswordEncoder`.

## Monitoring
- **Spring Actuator:** Available at `/actuator/health` to monitor application uptime.
- **Structured Logging:** Centralized via Logback, outputting daily rolling logs to `logs/synergi.log`.
