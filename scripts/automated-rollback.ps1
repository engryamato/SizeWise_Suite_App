# SizeWise Suite Automated Rollback Script (PowerShell)
# 
# Automated rollback mechanisms for failed deployments
# Part of Phase 1 bridging plan for deployment reliability
# 
# @see docs/post-implementation-bridging-plan.md Task 1.3

param(
    [string]$Command = "auto",
    [string]$Target = "",
    [int]$RollbackTimeout = 300  # 5 minutes
)

# Configuration
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
$LogFile = Join-Path $ProjectRoot "logs\rollback.log"
$BackupDir = Join-Path $ProjectRoot "backups"
$DeploymentHistoryFile = Join-Path $ProjectRoot "logs\deployment-history.json"

# Create necessary directories
$LogsDir = Split-Path -Parent $LogFile
if (-not (Test-Path $LogsDir)) {
    New-Item -ItemType Directory -Path $LogsDir -Force | Out-Null
}
if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
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

# Notification function
function Send-Notification {
    param(
        [string]$Status,
        [string]$Message
    )
    
    Write-LogInfo "Sending rollback notification: $Status"
    
    # Send to Slack if webhook is configured
    $WebhookUrl = $env:SLACK_WEBHOOK_URL
    if ($WebhookUrl) {
        $Color = if ($Status -eq "success") { "good" } else { "danger" }
        $Environment = if ($env:ENVIRONMENT) { $env:ENVIRONMENT } else { "production" }
        $Timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-dd HH:mm:ss UTC")
        
        $Payload = @{
            text        = "🔄 SizeWise Suite Rollback Alert"
            attachments = @(
                @{
                    color  = $Color
                    fields = @(
                        @{
                            title = "Status"
                            value = $Status
                            short = $true
                        },
                        @{
                            title = "Environment"
                            value = $Environment
                            short = $true
                        },
                        @{
                            title = "Message"
                            value = $Message
                            short = $false
                        },
                        @{
                            title = "Timestamp"
                            value = $Timestamp
                            short = $true
                        }
                    )
                }
            )
        } | ConvertTo-Json -Depth 10
        
        try {
            Invoke-RestMethod -Uri $WebhookUrl -Method Post -Body $Payload -ContentType "application/json" | Out-Null
        }
        catch {
            Write-LogWarning "Failed to send Slack notification: $($_.Exception.Message)"
        }
    }
    
    # Log notification locally
    $NotificationLogPath = Join-Path $ProjectRoot "logs\rollback-notifications.log"
    $NotificationEntry = @{
        timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-dd HH:mm:ss UTC")
        status    = $Status
        message   = $Message
    } | ConvertTo-Json -Compress
    
    Add-Content -Path $NotificationLogPath -Value $NotificationEntry
}

# Get last successful deployment
function Get-LastSuccessfulDeployment {
    if (Test-Path $DeploymentHistoryFile) {
        try {
            $History = Get-Content $DeploymentHistoryFile | ConvertFrom-Json
            $SuccessfulDeployments = $History.deployments | Where-Object { $_.status -eq "success" } | Sort-Object timestamp
            
            if ($SuccessfulDeployments.Count -gt 0) {
                $LastDeployment = $SuccessfulDeployments[-1]
                return $LastDeployment.deployment_id
            }
        }
        catch {
            Write-LogWarning "Failed to parse deployment history: $($_.Exception.Message)"
        }
    }
    
    Write-LogWarning "No successful deployment found in history"
    return $null
}

# Record deployment in history
function Add-DeploymentRecord {
    param(
        [string]$DeploymentId,
        [string]$Status
    )
    
    $Timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-dd HH:mm:ss UTC")
    $Environment = if ($env:ENVIRONMENT) { $env:ENVIRONMENT } else { "production" }
    
    # Create deployment history file if it doesn't exist
    if (-not (Test-Path $DeploymentHistoryFile)) {
        $InitialHistory = @{ deployments = @() } | ConvertTo-Json
        Set-Content -Path $DeploymentHistoryFile -Value $InitialHistory
    }
    
    # Add new deployment record
    try {
        $History = Get-Content $DeploymentHistoryFile | ConvertFrom-Json
        $NewRecord = @{
            deployment_id = $DeploymentId
            status        = $Status
            timestamp     = $Timestamp
            environment   = $Environment
        }
        
        $History.deployments += $NewRecord
        $History | ConvertTo-Json -Depth 10 | Set-Content -Path $DeploymentHistoryFile
        
        Write-LogInfo "Recorded deployment $DeploymentId with status $Status"
    }
    catch {
        Write-LogError "Failed to record deployment: $($_.Exception.Message)"
    }
}

# Docker-based rollback
function Start-DockerRollback {
    param([string]$TargetDeploymentId)
    
    Write-LogInfo "Starting Docker-based rollback to deployment: $TargetDeploymentId"
    
    # Check if target deployment images exist
    $FrontendImage = "sizewise-frontend:$TargetDeploymentId"
    $BackendImage = "sizewise-backend:$TargetDeploymentId"
    
    try {
        docker image inspect $FrontendImage | Out-Null
    }
    catch {
        Write-LogError "Frontend image $FrontendImage not found"
        return $false
    }
    
    try {
        docker image inspect $BackendImage | Out-Null
    }
    catch {
        Write-LogError "Backend image $BackendImage not found"
        return $false
    }
    
    # Stop current services
    Write-LogInfo "Stopping current services..."
    try {
        docker-compose down --timeout 30
    }
    catch {
        Write-LogWarning "Some services may not have stopped gracefully"
    }
    
    # Create rollback compose file
    Write-LogInfo "Updating service configuration for rollback..."
    
    $RollbackComposeContent = @"
version: '3.8'
services:
  frontend:
    image: $FrontendImage
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=`${NODE_ENV:-production}
    depends_on:
      - backend
    restart: unless-stopped

  backend:
    image: $BackendImage
    ports:
      - "5000:5000"
    environment:
      - FLASK_ENV=`${FLASK_ENV:-production}
      - POSTGRES_HOST=`${POSTGRES_HOST:-postgres}
      - REDIS_HOST=`${REDIS_HOST:-redis}
    depends_on:
      - postgres
      - redis
    restart: unless-stopped

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=`${POSTGRES_DB:-sizewise}
      - POSTGRES_USER=`${POSTGRES_USER:-sizewise}
      - POSTGRES_PASSWORD=`${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass `${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
"@
    
    $RollbackComposePath = Join-Path $ProjectRoot "docker-compose.rollback.yml"
    Set-Content -Path $RollbackComposePath -Value $RollbackComposeContent
    
    # Start services with rollback configuration
    Write-LogInfo "Starting services with rollback configuration..."
    try {
        docker-compose -f $RollbackComposePath up -d
        Write-LogSuccess "Services started successfully with rollback configuration"
        return $true
    }
    catch {
        Write-LogError "Failed to start services with rollback configuration: $($_.Exception.Message)"
        return $false
    }
}

# Git-based rollback
function Start-GitRollback {
    param([string]$TargetCommit)
    
    Write-LogInfo "Starting Git-based rollback to commit: $TargetCommit"
    
    # Verify target commit exists
    try {
        git rev-parse --verify $TargetCommit | Out-Null
    }
    catch {
        Write-LogError "Target commit $TargetCommit not found"
        return $false
    }
    
    # Create backup of current state
    $CurrentCommit = git rev-parse HEAD
    Write-LogInfo "Creating backup of current state: $CurrentCommit"
    
    # Perform rollback
    try {
        git checkout $TargetCommit
        Write-LogSuccess "Git rollback completed to commit: $TargetCommit"
        
        # Restart services to apply changes
        Write-LogInfo "Restarting services to apply rollback..."
        docker-compose restart
        Write-LogSuccess "Services restarted successfully"
        return $true
    }
    catch {
        Write-LogError "Git rollback failed: $($_.Exception.Message)"
        # Attempt to restore previous state
        git checkout $CurrentCommit
        return $false
    }
}

# Verify rollback success
function Test-RollbackSuccess {
    Write-LogInfo "Verifying rollback success..."
    
    # Wait for services to stabilize
    Start-Sleep -Seconds 30
    
    # Run health checks
    $HealthCheckScript = Join-Path $ScriptDir "health-check.ps1"
    try {
        & $HealthCheckScript
        if ($LASTEXITCODE -eq 0) {
            Write-LogSuccess "Rollback verification passed - system is healthy"
            return $true
        }
        else {
            Write-LogError "Rollback verification failed - system still unhealthy"
            return $false
        }
    }
    catch {
        Write-LogError "Failed to run health checks: $($_.Exception.Message)"
        return $false
    }
}

# Main rollback function
function Start-Rollback {
    param(
        [string]$RollbackType = "auto",
        [string]$TargetDeployment = ""
    )
    
    $StartTime = Get-Date
    
    Write-LogInfo "Starting automated rollback process..."
    Write-LogInfo "Rollback type: $RollbackType"
    
    # Get target deployment if not specified
    if (-not $TargetDeployment) {
        $TargetDeployment = Get-LastSuccessfulDeployment
        if (-not $TargetDeployment) {
            Write-LogError "Cannot determine target deployment for rollback"
            Send-Notification "failed" "Rollback failed: No target deployment found"
            return $false
        }
    }
    
    Write-LogInfo "Target deployment for rollback: $TargetDeployment"
    
    # Record rollback attempt
    $RollbackId = "rollback-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    Add-DeploymentRecord $RollbackId "in_progress"
    
    # Perform rollback based on type
    $RollbackSuccess = $false
    
    switch ($RollbackType) {
        "docker" {
            $RollbackSuccess = Start-DockerRollback $TargetDeployment
        }
        "git" {
            $RollbackSuccess = Start-GitRollback $TargetDeployment
        }
        default {
            # Try Docker rollback first, then Git rollback
            $RollbackSuccess = (Start-DockerRollback $TargetDeployment) -or (Start-GitRollback $TargetDeployment)
        }
    }
    
    # Verify rollback
    if ($RollbackSuccess -and (Test-RollbackSuccess)) {
        $EndTime = Get-Date
        $Duration = ($EndTime - $StartTime).TotalSeconds
        
        Write-LogSuccess "Rollback completed successfully in $([math]::Round($Duration, 2)) seconds"
        Add-DeploymentRecord $RollbackId "success"
        Send-Notification "success" "Rollback completed successfully to deployment $TargetDeployment in $([math]::Round($Duration, 2))s"
        return $true
    }
    else {
        $EndTime = Get-Date
        $Duration = ($EndTime - $StartTime).TotalSeconds
        
        Write-LogError "Rollback failed after $([math]::Round($Duration, 2)) seconds"
        Add-DeploymentRecord $RollbackId "failed"
        Send-Notification "failed" "Rollback failed after $([math]::Round($Duration, 2))s - manual intervention required"
        return $false
    }
}

# Main execution
function Main {
    Write-LogInfo "SizeWise Suite Automated Rollback Script v1.0 (PowerShell)"
    
    switch ($Command) {
        "auto" {
            Write-LogInfo "Starting automated rollback..."
            if (Start-Rollback "auto" $Target) {
                exit 0
            }
            else {
                exit 1
            }
        }
        "manual" {
            if (-not $Target) {
                Write-LogError "Manual rollback requires target deployment ID"
                Write-Host "Usage: .\automated-rollback.ps1 -Command manual -Target <deployment_id>"
                exit 1
            }
            Write-LogInfo "Starting manual rollback to deployment: $Target"
            if (Start-Rollback "auto" $Target) {
                exit 0
            }
            else {
                exit 1
            }
        }
        "docker" {
            if (-not $Target) {
                Write-LogError "Docker rollback requires target deployment ID"
                Write-Host "Usage: .\automated-rollback.ps1 -Command docker -Target <deployment_id>"
                exit 1
            }
            if (Start-Rollback "docker" $Target) {
                exit 0
            }
            else {
                exit 1
            }
        }
        "git" {
            if (-not $Target) {
                Write-LogError "Git rollback requires target commit"
                Write-Host "Usage: .\automated-rollback.ps1 -Command git -Target <commit_hash>"
                exit 1
            }
            if (Start-Rollback "git" $Target) {
                exit 0
            }
            else {
                exit 1
            }
        }
        default {
            Write-Host "Usage: .\automated-rollback.ps1 -Command {auto|manual|docker|git} [-Target <target>]"
            Write-Host "  auto   - Automatic rollback to last successful deployment"
            Write-Host "  manual - Manual rollback to specified deployment"
            Write-Host "  docker - Docker-based rollback to specified deployment"
            Write-Host "  git    - Git-based rollback to specified commit"
            exit 1
        }
    }
}

# Run main function
Main
