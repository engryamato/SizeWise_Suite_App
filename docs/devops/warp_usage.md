# Warp AI Shell Usage Guide

## 1. About Warp

Warp is an AI-powered shell agent that enables safe, auditable, and efficient automation for development and DevOps workflows. This guide provides approved commands, safety protocols, and usage patterns that align with our security and operational standards.

### Purpose
- Enable controlled automation of routine development tasks
- Maintain comprehensive audit trails of all operations  
- Provide non-destructive rollback capabilities
- Ensure team-wide consistency in automation practices

### Key Principles
- **Non-destructive**: All operations must be safely reversible
- **Auditable**: Every command and output is logged
- **Controlled**: Only approved commands from this guide
- **Confirmed**: User confirmation required for risky operations

## 2. Approved Commands

### 2.1 Project Build & Test Operations
These commands are considered safe and can be executed without additional confirmation:

```bash
# Build operations
npm run build
npm run dev  
npm run start
npm run clean
yarn build
yarn dev
yarn start

# Testing
npm test
npm run test:unit
npm run test:integration
npm run test:e2e
yarn test

# Linting and formatting
npm run lint
npm run lint:fix
npm run format
eslint . --fix
prettier --write .

# Dependency management
npm install
npm audit
npm audit fix
yarn install
yarn audit

# Status and information
git status
git log --oneline -10
git branch
git diff --name-only
npm outdated
yarn outdated
```

### 2.2 Safe File Operations
These operations require confirmation prompts:

```bash
# Archive and backup (non-destructive)
tar -czf backup_$(date +%Y%m%d).tar.gz ./src
zip -r backup_$(date +%Y%m%d).zip ./docs

# Log viewing
tail -f logs/*.log
cat package.json
ls -la

# Service status checks
docker ps
docker-compose ps
systemctl status [service-name]
```

### 2.3 Warp-Specific Commands

#### Centralized Logging
Use the Warp logger script for all command execution:

```powershell
# PowerShell (Windows)
./scripts/warp_logger.ps1 -Command "npm run build" -Description "Building project"
./scripts/warp_logger.ps1 -Command "git status" -Description "Check repository status"

# Log only (without execution)
./scripts/warp_logger.ps1 -Command "risky-command" -Description "Testing command" -LogOnly
```

#### Environment Rollback
Use the restore script for safe environment rollback:

```bash
# List available backups
./scripts/rollback/restore_env.sh --list-backups

# Dry run (preview changes)
./scripts/rollback/restore_env.sh --dry-run --commit-hash HEAD~1

# Restore to previous commit
./scripts/rollback/restore_env.sh --commit-hash HEAD~1

# Restore with database backup
./scripts/rollback/restore_env.sh --commit-hash abc1234 --backup-name "backup_20250101_120000"
```

## 3. Prohibited Actions

### 3.1 Strictly Forbidden
These commands must NEVER be executed through Warp:

```bash
# File/directory deletion
rm -rf *
del /s /q *
rmdir /s
git clean -fdx (without confirmation)

# System modifications
sudo anything
chmod 777
chown -R
systemctl stop/restart critical-services

# Credential/secret operations
echo $SECRET_KEY
cat ~/.ssh/id_rsa
git config --global user.password

# Network/firewall changes
iptables -F
ufw disable
netsh firewall

# Package manager global installs
npm install -g
pip install --user
```

### 3.2 Requires Special Authorization
These operations need explicit DevOps team approval:

- Database schema migrations
- Production deployments
- SSL certificate updates
- DNS record changes
- CI/CD pipeline modifications

## 4. Sample Usage Workflows

### 4.1 Standard Development Workflow

```bash
# 1. Check project status
./scripts/warp_logger.ps1 -Command "git status" -Description "Check current status"

# 2. Run tests
./scripts/warp_logger.ps1 -Command "npm test" -Description "Execute test suite"

# 3. Build project
./scripts/warp_logger.ps1 -Command "npm run build" -Description "Build for production"

# 4. Check for issues
./scripts/warp_logger.ps1 -Command "npm run lint" -Description "Check code quality"
```

### 4.2 Emergency Rollback Workflow

```bash
# 1. Check what backups are available
./scripts/rollback/restore_env.sh --list-backups

# 2. Preview rollback (dry run)
./scripts/rollback/restore_env.sh --dry-run --commit-hash HEAD~2

# 3. Execute rollback with confirmation
./scripts/rollback/restore_env.sh --commit-hash HEAD~2
```

### 4.3 Dependency Management Workflow

```bash
# 1. Check outdated packages
./scripts/warp_logger.ps1 -Command "npm outdated" -Description "Check outdated dependencies"

# 2. Update dependencies
./scripts/warp_logger.ps1 -Command "npm update" -Description "Update packages"

# 3. Run security audit
./scripts/warp_logger.ps1 -Command "npm audit" -Description "Security audit"

# 4. Test after updates
./scripts/warp_logger.ps1 -Command "npm test" -Description "Verify updates don't break functionality"
```

## 5. Adding New Workflows

### 5.1 Approval Process

1. **Document the workflow** in this file under a new section
2. **Test in isolated environment** (VM/container)
3. **Review with DevOps team** for security implications
4. **Update this guide** with the approved workflow
5. **Announce to team** via appropriate communication channels

### 5.2 Testing New Commands

Before adding any new command to the approved list:

```bash
# 1. Test with dry-run flag (if available)
command --dry-run

# 2. Test in disposable environment
docker run -it --rm test-image command

# 3. Log the test session
./scripts/warp_logger.ps1 -Command "command" -Description "Testing new workflow" -LogOnly
```

### 5.3 Workflow Template

When proposing new workflows, use this template:

```markdown
### X.X New Workflow Name

**Purpose**: Brief description of what this achieves
**Risk Level**: Low/Medium/High
**Approval Status**: Pending/Approved/Rejected

**Commands**:
```bash
# Command 1 with description
command1 --options

# Command 2 with description
command2 --options
```

**Prerequisites**: What needs to be set up first
**Validation**: How to verify the workflow succeeded
**Rollback**: How to undo if something goes wrong
```

## 6. Troubleshooting

### 6.1 Common Issues

#### Warp Logger Issues
```bash
# If PowerShell execution policy blocks scripts
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# If log directory doesn't exist
mkdir C:\warp-logs

# Check recent log entries
Get-Content C:\warp-logs\warp_session_$(Get-Date -Format "yyyyMMdd").log | Select-Object -Last 20
```

#### Rollback Script Issues
```bash
# If script permissions are incorrect
chmod +x ./scripts/rollback/restore_env.sh

# If git repository is in detached state
git checkout main
git pull origin main

# Check backup directories exist
ls -la ./backups/
```

### 6.2 Log Locations

- **Warp Command Logs**: `C:\warp-logs\warp_session_YYYYMMDD.log`
- **Rollback Operation Logs**: `./warp-logs/restore_env_YYYYMMDD.log`
- **Git Snapshots**: `./backups/git-snapshots/`
- **Database Backups**: `./backups/database/`

### 6.3 Escalation Contacts

| Issue Type | Contact | Method |
|------------|---------|---------|
| Security Concerns | DevOps Lead | Immediate escalation |
| Command Failures | Development Team | Slack #dev-support |
| Access Issues | IT Support | Support ticket |
| Emergency Rollback | DevOps On-Call | Emergency contact |

## 7. Security Notes

### 7.1 Log Security
- All logs are stored locally with restricted access
- Logs are automatically rotated daily
- Sensitive output is automatically redacted
- Logs should be reviewed regularly for anomalies

### 7.2 Access Control
- Warp should run in non-administrator mode
- Use dedicated service accounts where applicable
- Regular review of command history and access patterns
- Immediate revocation of access for departed team members

### 7.3 Audit Requirements
- All Warp sessions must be logged
- Monthly review of command usage patterns
- Quarterly security assessment of approved commands
- Immediate investigation of any unauthorized command execution

## 8. Version History

| Version | Date | Changes | Approved By |
|---------|------|---------|-------------|
| 1.0 | 2025-08-06 | Initial version with logging and rollback scripts | Initial setup |

## 9. Script Reference

### 9.1 Warp Logger (`/scripts/warp_logger.ps1`)
Centralized logging script that captures all command execution and outputs to dated log files.

**Features**:
- Automatic log directory creation
- Timestamped entries with command descriptions
- Exit code tracking
- Error handling and reporting
- Log-only mode for testing
- Recent log entry display

### 9.2 Environment Restore (`/scripts/rollback/restore_env.sh`)
Non-destructive rollback script for git hard-reset and database restore operations.

**Features**:
- Git snapshot creation before changes
- Multiple database format support (SQLite, MySQL, PostgreSQL)
- Comprehensive logging of all operations
- Dry-run mode for testing
- User confirmation prompts
- Backup directory management

---

## Quick Reference Card

### Essential Commands
```bash
# Log and execute command
./scripts/warp_logger.ps1 -Command "npm test" -Description "Run tests"

# Rollback environment
./scripts/rollback/restore_env.sh --commit-hash HEAD~1

# List database backups
./scripts/rollback/restore_env.sh --list-backups

# Check logs
Get-Content C:\warp-logs\warp_session_$(Get-Date -Format "yyyyMMdd").log | Select-Object -Last 10
```

### Emergency Procedures
1. Stop any running Warp operations
2. Check recent logs for errors
3. Execute rollback with `--dry-run` first
4. Contact DevOps team if uncertain
5. Document the incident for review
