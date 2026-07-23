# ─── Build stage ─────────────────────────────────────────────────────────────
FROM maven:3.9.6-eclipse-temurin-21 AS build
WORKDIR /app
# Cache dependency downloads separately from source
COPY pom.xml .
RUN mvn dependency:go-offline -q
# Build (tests skipped for image build; run tests in CI before building image)
COPY src ./src
RUN mvn clean package -DskipTests -q

# ─── Run stage ────────────────────────────────────────────────────────────────
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar

# Expose the application port (overridden by PORT env var at runtime)
EXPOSE 8080

# Activate the production Spring profile.
# All credentials (DATABASE_URL, DATABASE_USERNAME, DATABASE_PASSWORD, etc.)
# are injected at runtime via environment variables — never baked into the image.
ENV SPRING_PROFILES_ACTIVE=prod

ENTRYPOINT ["java", \
  "-XX:+UseContainerSupport", \
  "-XX:MaxRAMPercentage=75.0", \
  "-Djava.security.egd=file:/dev/./urandom", \
  "-jar", "app.jar"]
