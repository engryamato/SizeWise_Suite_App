# Warp Logger - Centralized Logging for Warp Commands
# Auto-appends command outputs to dated logs for audit and debugging
#
# Usage: 
#   ./warp_logger.ps1 -Command "npm run build" -Description "Building project"
#   ./warp_logger.ps1 -Command "git status" -Description "Check git status" -LogOnly
#
# Parameters:
#   -Command: The command to execute and log
#   -Description: Human-readable description of the command
#   -LogOnly: Only log the command without executing (for manual logging)

param(
    [Parameter(Mandatory=$true)]
    [string]$Command,
    
    [Parameter(Mandatory=$true)]
    [string]$Description,
    
    [switch]$LogOnly,
    
    [string]$LogDirectory = "C:\warp-logs"
)

# Ensure log directory exists
if (!(Test-Path $LogDirectory)) {
    New-Item -ItemType Directory -Path $LogDirectory -Force | Out-Null
}

# Generate dated log filename
$Date = Get-Date -Format "yyyyMMdd"
$LogFile = Join-Path $LogDirectory "warp_session_$Date.log"

# Create log entry header
$Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$Separator = "=" * 80
$LogHeader = @"

$Separator
[$Timestamp] WARP COMMAND EXECUTION
Description: $Description
Command: $Command
$Separator

"@

# Function to write to log file safely
function Write-LogEntry {
    param($Content)
    try {
        Add-Content -Path $LogFile -Value $Content -Encoding UTF8
    }
    catch {
        Write-Error "Failed to write to log file: $_"
    }
}

# Write header to log
Write-LogEntry $LogHeader

if ($LogOnly) {
    Write-LogEntry "STATUS: Command logged only (not executed)"
    Write-Host "Command logged to: $LogFile" -ForegroundColor Green
    return
}

# Execute command and capture output
try {
    Write-Host "Executing: $Command" -ForegroundColor Yellow
    Write-LogEntry "STATUS: Executing command..."
    
    # Capture both stdout and stderr
    $Output = Invoke-Expression $Command 2>&1
    
    # Log the output
    Write-LogEntry "OUTPUT:"
    Write-LogEntry $Output
    
    # Check if command was successful
    if ($LASTEXITCODE -eq 0) {
        Write-LogEntry "STATUS: Command completed successfully (Exit Code: 0)"
        Write-Host "Command completed successfully" -ForegroundColor Green
    } else {
        Write-LogEntry "STATUS: Command failed (Exit Code: $LASTEXITCODE)"
        Write-Host "Command failed with exit code: $LASTEXITCODE" -ForegroundColor Red
    }
}
catch {
    $ErrorMessage = $_.Exception.Message
    Write-LogEntry "ERROR: $ErrorMessage"
    Write-Host "Error executing command: $ErrorMessage" -ForegroundColor Red
}

# Log footer
$LogFooter = @"
[$Timestamp] END COMMAND EXECUTION
$Separator

"@

Write-LogEntry $LogFooter

Write-Host "Full log available at: $LogFile" -ForegroundColor Cyan

# Optional: Display recent log entries (last 10 lines for quick feedback)
if (Test-Path $LogFile) {
    Write-Host "`nRecent log entries:" -ForegroundColor Magenta
    Get-Content $LogFile | Select-Object -Last 10 | ForEach-Object { Write-Host $_ -ForegroundColor Gray }
}
