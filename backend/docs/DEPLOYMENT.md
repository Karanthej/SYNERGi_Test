# Deployment & Launch Readiness Guide

## Prerequisites
- PostgreSQL 15+ database instance (e.g., Neon, RDS, Supabase)
- Java 17+ environment (e.g., AWS Elastic Beanstalk, Heroku, Render)
- Node.js 18+ environment (for Frontend build)

## Backend Deployment
1. Configure Environment Variables in your host environment:
   - `DATABASE_URL=jdbc:postgresql://<host>:5432/<dbname>`
   - `DATABASE_USERNAME=<user>`
   - `DATABASE_PASSWORD=<pass>`
   - `JWT_SECRET=<strong-random-256-bit-string>`
   - `SPRING_PROFILES_ACTIVE=prod`

2. Build the JAR:
   ```bash
   cd backend
   mvn clean package -DskipTests
   ```

3. Run the Application:
   ```bash
   java -jar target/backend-0.0.1-SNAPSHOT.jar
   ```

## Frontend Deployment
1. Configure Environment Variables:
   - `VITE_API_BASE_URL=https://api.yourdomain.com/api/v1`
   - `VITE_WS_URL=wss://api.yourdomain.com/ws`

2. Build for production:
   ```bash
   cd frontend
   npm install
   npm run build
   ```

3. Serve the `dist/` directory via a static host (Vercel, Netlify, AWS S3+CloudFront, or NGINX).

## Backup Strategy
- **Database:** Schedule daily `pg_dump` snapshots to off-site storage (AWS S3) using `pg_cron` or standard cron jobs.
- **Files:** Ensure uploaded media (if stored locally) is backed up daily via `rsync`, or use cloud-native object storage (S3).
