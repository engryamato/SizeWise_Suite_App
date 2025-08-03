# SizeWise Suite Health Check Script (PowerShell)
# 
# Comprehensive health checks for automated rollback mechanisms
# Part of Phase 1 bridging plan for deployment reliability
# 
# @see docs/post-implementation-bridging-plan.md Task 1.3

param(
    [string]$BackendUrl = $(if ($env:BACKEND_URL) { $env:BACKEND_URL } else { "http://localhost:5000" }),
    [string]$FrontendUrl = $(if ($env:FRONTEND_URL) { $env:FRONTEND_URL } else { "http://localhost:3000" }),
    [string]$AuthUrl = $(if ($env:AUTH_URL) { $env:AUTH_URL } else { "http://localhost:8000" }),
    [int]$Timeout = 30,
    [int]$MaxRetries = 3,
    [int]$HealthCheckInterval = 5
)

# Configuration
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
$LogFile = Join-Path $ProjectRoot "logs\health-check.log"

# Create logs directory if it doesn't exist
$LogsDir = Split-Path -Parent $LogFile
if (-not (Test-Path $LogsDir)) {
    New-Item -ItemType Directory -Path $LogsDir -Force | Out-Null
}

# Logging functions
function Write-Log {
    param(
        [string]$Level,
        [string]$Message
    )
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $LogEntry = "$Timestamp [$Level] $Message"
    Write-Host $LogEntry
    Add-Content -Path $LogFile -Value $LogEntry
}

function Write-LogInfo {
    param([string]$Message)
    Write-Log "INFO" $Message
}

function Write-LogSuccess {
    param([string]$Message)
    Write-Host $Message -ForegroundColor Green
    Write-Log "SUCCESS" $Message
}

function Write-LogWarning {
    param([string]$Message)
    Write-Host $Message -ForegroundColor Yellow
    Write-Log "WARNING" $Message
}

function Write-LogError {
    param([string]$Message)
    Write-Host $Message -ForegroundColor Red
    Write-Log "ERROR" $Message
}

# Health check functions
function Test-BackendHealth {
    $Endpoint = "$BackendUrl/api/health"
    Write-LogInfo "Checking backend health at $Endpoint"
    
    for ($i = 1; $i -le $MaxRetries; $i++) {
        try {
            $Response = Invoke-RestMethod -Uri $Endpoint -TimeoutSec $Timeout -ErrorAction Stop
            Write-LogSuccess "Backend health check passed (attempt $i/$MaxRetries)"
            return $true
        }
        catch {
            Write-LogWarning "Backend health check failed (attempt $i/$MaxRetries): $($_.Exception.Message)"
            if ($i -lt $MaxRetries) {
                Start-Sleep -Seconds $HealthCheckInterval
            }
        }
    }
    
    Write-LogError "Backend health check failed after $MaxRetries attempts"
    return $false
}

function Test-FrontendHealth {
    Write-LogInfo "Checking frontend health at $FrontendUrl"
    
    for ($i = 1; $i -le $MaxRetries; $i++) {
        try {
            $Response = Invoke-WebRequest -Uri $FrontendUrl -TimeoutSec $Timeout -ErrorAction Stop
            if ($Response.StatusCode -eq 200) {
                Write-LogSuccess "Frontend health check passed (attempt $i/$MaxRetries)"
                return $true
            }
        }
        catch {
            Write-LogWarning "Frontend health check failed (attempt $i/$MaxRetries): $($_.Exception.Message)"
            if ($i -lt $MaxRetries) {
                Start-Sleep -Seconds $HealthCheckInterval
            }
        }
    }
    
    Write-LogError "Frontend health check failed after $MaxRetries attempts"
    return $false
}

function Test-AuthServiceHealth {
    $Endpoint = "$AuthUrl/api/health"
    Write-LogInfo "Checking auth service health at $Endpoint"
    
    for ($i = 1; $i -le $MaxRetries; $i++) {
        try {
            $Response = Invoke-RestMethod -Uri $Endpoint -TimeoutSec $Timeout -ErrorAction Stop
            Write-LogSuccess "Auth service health check passed (attempt $i/$MaxRetries)"
            return $true
        }
        catch {
            Write-LogWarning "Auth service health check failed (attempt $i/$MaxRetries): $($_.Exception.Message)"
            if ($i -lt $MaxRetries) {
                Start-Sleep -Seconds $HealthCheckInterval
            }
        }
    }
    
    Write-LogError "Auth service health check failed after $MaxRetries attempts"
    return $false
}

function Test-DatabaseHealth {
    $DbHost = if ($env:POSTGRES_HOST) { $env:POSTGRES_HOST } else { "localhost" }
    $DbPort = if ($env:POSTGRES_PORT) { $env:POSTGRES_PORT } else { "5432" }
    $DbName = if ($env:POSTGRES_DB) { $env:POSTGRES_DB } else { "sizewise" }
    
    Write-LogInfo "Checking database health at ${DbHost}:${DbPort}"
    
    # Test TCP connection to database
    for ($i = 1; $i -le $MaxRetries; $i++) {
        try {
            $TcpClient = New-Object System.Net.Sockets.TcpClient
            $TcpClient.ConnectAsync($DbHost, $DbPort).Wait($Timeout * 1000)
            if ($TcpClient.Connected) {
                $TcpClient.Close()
                Write-LogSuccess "Database health check passed (attempt $i/$MaxRetries)"
                return $true
            }
        }
        catch {
            Write-LogWarning "Database health check failed (attempt $i/$MaxRetries): $($_.Exception.Message)"
            if ($i -lt $MaxRetries) {
                Start-Sleep -Seconds $HealthCheckInterval
            }
        }
    }
    
    Write-LogError "Database health check failed after $MaxRetries attempts"
    return $false
}

function Test-RedisHealth {
    $RedisHost = if ($env:REDIS_HOST) { $env:REDIS_HOST } else { "localhost" }
    $RedisPort = if ($env:REDIS_PORT) { $env:REDIS_PORT } else { "6379" }
    
    Write-LogInfo "Checking Redis health at ${RedisHost}:${RedisPort}"
    
    # Test TCP connection to Redis
    for ($i = 1; $i -le $MaxRetries; $i++) {
        try {
            $TcpClient = New-Object System.Net.Sockets.TcpClient
            $TcpClient.ConnectAsync($RedisHost, $RedisPort).Wait($Timeout * 1000)
            if ($TcpClient.Connected) {
                $TcpClient.Close()
                Write-LogSuccess "Redis health check passed (attempt $i/$MaxRetries)"
                return $true
            }
        }
        catch {
            Write-LogWarning "Redis health check failed (attempt $i/$MaxRetries): $($_.Exception.Message)"
            if ($i -lt $MaxRetries) {
                Start-Sleep -Seconds $HealthCheckInterval
            }
        }
    }
    
    Write-LogError "Redis health check failed after $MaxRetries attempts"
    return $false
}

function Test-HVACCalculations {
    $Endpoint = "$BackendUrl/api/calculations/air-duct"
    Write-LogInfo "Checking HVAC calculation functionality"
    
    $TestData = @{
        airflow   = 1000
        velocity  = 1500
        duct_type = "rectangular"
        material  = "galvanized_steel"
    } | ConvertTo-Json
    
    for ($i = 1; $i -le $MaxRetries; $i++) {
        try {
            $Response = Invoke-RestMethod -Uri $Endpoint -Method Post -Body $TestData -ContentType "application/json" -TimeoutSec $Timeout -ErrorAction Stop
            if ($Response.duct_size) {
                Write-LogSuccess "HVAC calculation health check passed (attempt $i/$MaxRetries)"
                return $true
            }
        }
        catch {
            Write-LogWarning "HVAC calculation health check failed (attempt $i/$MaxRetries): $($_.Exception.Message)"
            if ($i -lt $MaxRetries) {
                Start-Sleep -Seconds $HealthCheckInterval
            }
        }
    }
    
    Write-LogError "HVAC calculation health check failed after $MaxRetries attempts"
    return $false
}

function Test-ComplianceSystem {
    $Endpoint = "$BackendUrl/api/compliance/check"
    Write-LogInfo "Checking compliance system functionality"
    
    $TestData = @{
        velocity    = 1500
        duct_type   = "rectangular"
        application = "supply"
    } | ConvertTo-Json
    
    for ($i = 1; $i -le $MaxRetries; $i++) {
        try {
            $Response = Invoke-RestMethod -Uri $Endpoint -Method Post -Body $TestData -ContentType "application/json" -TimeoutSec $Timeout -ErrorAction Stop
            if ($Response.validation) {
                Write-LogSuccess "Compliance system health check passed (attempt $i/$MaxRetries)"
                return $true
            }
        }
        catch {
            Write-LogWarning "Compliance system health check failed (attempt $i/$MaxRetries): $($_.Exception.Message)"
            if ($i -lt $MaxRetries) {
                Start-Sleep -Seconds $HealthCheckInterval
            }
        }
    }
    
    Write-LogError "Compliance system health check failed after $MaxRetries attempts"
    return $false
}

function Test-AdvancedCompliance {
    $Endpoint = "$BackendUrl/api/compliance/standards-info"
    Write-LogInfo "Checking advanced compliance standards (ASHRAE 90.2, IECC 2024)"
    
    for ($i = 1; $i -le $MaxRetries; $i++) {
        try {
            $Response = Invoke-RestMethod -Uri $Endpoint -TimeoutSec $Timeout -ErrorAction Stop
            $ResponseText = $Response | ConvertTo-Json
            if ($ResponseText -match "ASHRAE 90.2" -and $ResponseText -match "IECC 2024") {
                Write-LogSuccess "Advanced compliance health check passed (attempt $i/$MaxRetries)"
                return $true
            }
        }
        catch {
            Write-LogWarning "Advanced compliance health check failed (attempt $i/$MaxRetries): $($_.Exception.Message)"
            if ($i -lt $MaxRetries) {
                Start-Sleep -Seconds $HealthCheckInterval
            }
        }
    }
    
    Write-LogError "Advanced compliance health check failed after $MaxRetries attempts"
    return $false
}

# Main health check function
function Start-HealthChecks {
    $StartTime = Get-Date
    $FailedChecks = 0
    $TotalChecks = 8
    
    Write-LogInfo "Starting comprehensive health checks..."
    Write-LogInfo "Timeout: ${Timeout}s, Max retries: ${MaxRetries}, Check interval: ${HealthCheckInterval}s"
    
    # Core infrastructure checks
    if (-not (Test-BackendHealth)) { $FailedChecks++ }
    if (-not (Test-FrontendHealth)) { $FailedChecks++ }
    if (-not (Test-AuthServiceHealth)) { $FailedChecks++ }
    if (-not (Test-DatabaseHealth)) { $FailedChecks++ }
    if (-not (Test-RedisHealth)) { $FailedChecks++ }
    
    # Application functionality checks
    if (-not (Test-HVACCalculations)) { $FailedChecks++ }
    if (-not (Test-ComplianceSystem)) { $FailedChecks++ }
    if (-not (Test-AdvancedCompliance)) { $FailedChecks++ }
    
    $EndTime = Get-Date
    $Duration = ($EndTime - $StartTime).TotalSeconds
    
    Write-LogInfo "Health checks completed in $([math]::Round($Duration, 2)) seconds"
    Write-LogInfo "Results: $(($TotalChecks - $FailedChecks))/$TotalChecks checks passed"
    
    if ($FailedChecks -eq 0) {
        Write-LogSuccess "All health checks passed! System is healthy."
        return $true
    }
    else {
        Write-LogError "$FailedChecks/$TotalChecks health checks failed! System requires attention."
        return $false
    }
}

# Main execution
function Main {
    Write-LogInfo "SizeWise Suite Health Check Script v1.0 (PowerShell)"
    Write-LogInfo "Starting health checks for automated rollback system..."
    
    if (Start-HealthChecks) {
        Write-LogSuccess "Health check completed successfully"
        exit 0
    }
    else {
        Write-LogError "Health check failed - triggering rollback procedures"
        exit 1
    }
}

# Run main function
Main
