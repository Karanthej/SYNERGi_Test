# run.ps1 — Local development launcher (local PostgreSQL, dev Spring profile)
# ─────────────────────────────────────────────────────────────────────────────

$mavenVersion = "3.9.9"
$mavenDir     = "apache-maven-$mavenVersion"
$mavenUrl     = "https://repo.maven.apache.org/maven2/org/apache/maven/apache-maven/$mavenVersion/apache-maven-$mavenVersion-bin.zip"
$mavenZip     = "apache-maven-$mavenVersion-bin.zip"

# ── Download Maven if not present ────────────────────────────────────────────
if (-not (Test-Path $mavenDir)) {
    Write-Host "Downloading Maven $mavenVersion..."
    Invoke-WebRequest -Uri $mavenUrl -OutFile $mavenZip
    Write-Host "Extracting Maven..."
    Expand-Archive -Path $mavenZip -DestinationPath "." -Force
    Remove-Item $mavenZip
}

# ── Java home ─────────────────────────────────────────────────────────────────
$env:JAVA_HOME = "C:\Users\karan\.jdks\openjdk-26.0.1"
$env:PATH      = "$env:JAVA_HOME\bin;" + $env:PATH

# ── Load dev environment variables from .env.dev ─────────────────────────────
$envFile = ".env.dev"
if (Test-Path $envFile) {
    Write-Host "Loading environment from $envFile..."
    Get-Content $envFile | Where-Object { $_ -match "^\s*[^#].*=.*" } | ForEach-Object {
        $parts = $_ -split "=", 2
        if ($parts.Length -eq 2) {
            $key   = $parts[0].Trim()
            $value = $parts[1].Trim()
            [System.Environment]::SetEnvironmentVariable($key, $value, "Process")
        }
    }
} else {
    Write-Warning "$envFile not found — using defaults from application.yml"
}

# ── Start Spring Boot with dev profile ───────────────────────────────────────
Write-Host "Starting Spring Boot (profile=dev, port=$($env:PORT ?? 1026))..."
& ".\$mavenDir\bin\mvn.cmd" spring-boot:run -Dspring-boot.run.profiles=dev
