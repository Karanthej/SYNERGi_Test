# SYNERGi API Reference

## Authentication Endpoints
All authentication endpoints are located under `/api/v1/auth`. They do not require a JWT.
- `POST /register`: Registers a new user. Expects `email`, `password`, `fullName`, and `role`.
- `POST /login`: Validates credentials.
- `POST /otp/verify`: Completes MFA/email verification. Returns the final JWT payload.

## Protected Endpoints
Requires header: `Authorization: Bearer <token>`

### Startups
- `GET /api/v1/startups`: Retrieve paginated published startups (Talent view).
- `POST /api/v1/startups`: Create a new startup draft (Founder only).
- `PUT /api/v1/startups/{id}`: Update a startup's pitch or settings (Founder only).

### Workspaces
All workspace interactions require the user to be an active member of the startup team.
- `GET /api/v1/workspaces/{startupId}`: Get the workspace overview dashboard data.
- `GET /api/v1/workspaces/{startupId}/tasks`: Get all Kanban tasks.
- `POST /api/v1/workspaces/{startupId}/tasks`: Create a new task.

### Analytics
- `GET /api/v1/analytics/founder`: Retrieve metrics for the Founder Dashboard.
- `GET /api/v1/analytics/talent`: Retrieve metrics for the Talent Dashboard.

### Global Search
- `GET /api/v1/search?q={query}`: Returns a standardized list of matches across users and startups.

## Error Handling
The API follows a standardized JSON wrapper for success and error states:
```json
{
  "success": false,
  "message": "Resource not found",
  "data": null,
  "timestamp": "2026-07-09T10:00:00Z"
}
```
HTTP status codes clearly map to the issue (400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 500 Server Error).
