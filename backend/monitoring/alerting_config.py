"""
Alerting Configuration for SizeWise Suite

This module provides configuration management for the comprehensive alerting system.
It loads configuration from environment variables and provides sensible defaults.
"""

import os
from typing import List

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from AlertingManager import AlertConfiguration


def load_alerting_config() -> AlertConfiguration:
    """
    Load alerting configuration from environment variables.
    
    Environment Variables:
    - SMTP_SERVER: SMTP server hostname (default: smtp.gmail.com)
    - SMTP_PORT: SMTP server port (default: 587)
    - SMTP_USERNAME: SMTP username
    - SMTP_PASSWORD: SMTP password
    - EMAIL_FROM: From email address
    - EMAIL_RECIPIENTS: Comma-separated list of email recipients
    
    - SLACK_WEBHOOK_URL: Slack webhook URL
    - SLACK_CHANNEL: Slack channel (default: #alerts)
    - SLACK_USERNAME: Slack bot username (default: SizeWise Alerts)
    
    - TWILIO_ACCOUNT_SID: Twilio account SID
    - TWILIO_AUTH_TOKEN: Twilio auth token
    - TWILIO_FROM_NUMBER: Twilio from phone number
    - SMS_RECIPIENTS: Comma-separated list of SMS recipients
    
    - DISCORD_WEBHOOK_URL: Discord webhook URL
    - PAGERDUTY_INTEGRATION_KEY: PagerDuty integration key
    - TEAMS_WEBHOOK_URL: Microsoft Teams webhook URL
    
    - ALERT_RATE_LIMIT_WINDOW: Rate limit window in minutes (default: 15)
    - ALERT_MAX_PER_WINDOW: Max alerts per window (default: 10)
    - ALERT_DEDUP_WINDOW: Deduplication window in minutes (default: 30)
    """
    
    def parse_recipients(recipients_str: str) -> List[str]:
        """Parse comma-separated recipients string."""
        if not recipients_str:
            return []
        return [r.strip() for r in recipients_str.split(',') if r.strip()]
    
    return AlertConfiguration(
        # Email configuration
        smtp_server=os.getenv('SMTP_SERVER', 'smtp.gmail.com'),
        smtp_port=int(os.getenv('SMTP_PORT', '587')),
        smtp_username=os.getenv('SMTP_USERNAME', ''),
        smtp_password=os.getenv('SMTP_PASSWORD', ''),
        email_from=os.getenv('EMAIL_FROM', ''),
        email_recipients=parse_recipients(os.getenv('EMAIL_RECIPIENTS', '')),
        
        # Slack configuration
        slack_webhook_url=os.getenv('SLACK_WEBHOOK_URL', ''),
        slack_channel=os.getenv('SLACK_CHANNEL', '#alerts'),
        slack_username=os.getenv('SLACK_USERNAME', 'SizeWise Alerts'),
        
        # SMS configuration
        twilio_account_sid=os.getenv('TWILIO_ACCOUNT_SID', ''),
        twilio_auth_token=os.getenv('TWILIO_AUTH_TOKEN', ''),
        twilio_from_number=os.getenv('TWILIO_FROM_NUMBER', ''),
        sms_recipients=parse_recipients(os.getenv('SMS_RECIPIENTS', '')),
        
        # Discord configuration
        discord_webhook_url=os.getenv('DISCORD_WEBHOOK_URL', ''),
        
        # PagerDuty configuration
        pagerduty_integration_key=os.getenv('PAGERDUTY_INTEGRATION_KEY', ''),
        
        # Teams configuration
        teams_webhook_url=os.getenv('TEAMS_WEBHOOK_URL', ''),
        
        # Rate limiting configuration
        rate_limit_window_minutes=int(os.getenv('ALERT_RATE_LIMIT_WINDOW', '15')),
        max_alerts_per_window=int(os.getenv('ALERT_MAX_PER_WINDOW', '10')),
        
        # Deduplication configuration
        deduplication_window_minutes=int(os.getenv('ALERT_DEDUP_WINDOW', '30'))
    )


def get_sample_env_config() -> str:
    """
    Get sample environment configuration for alerting.
    
    Returns:
        str: Sample .env configuration
    """
    return """
# SizeWise Suite Alerting Configuration

# Email Alerting (SMTP)
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=sizewise-alerts@yourcompany.com
EMAIL_RECIPIENTS=admin@yourcompany.com,ops@yourcompany.com

# Slack Alerting
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK
SLACK_CHANNEL=#alerts
SLACK_USERNAME=SizeWise Alerts

# SMS Alerting (Twilio)
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_FROM_NUMBER=+1234567890
SMS_RECIPIENTS=+1234567890,+0987654321

# Discord Alerting
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/YOUR/DISCORD/WEBHOOK

# PagerDuty Integration
PAGERDUTY_INTEGRATION_KEY=your-pagerduty-integration-key

# Microsoft Teams Alerting
TEAMS_WEBHOOK_URL=https://outlook.office.com/webhook/YOUR/TEAMS/WEBHOOK

# Rate Limiting and Deduplication
ALERT_RATE_LIMIT_WINDOW=15
ALERT_MAX_PER_WINDOW=10
ALERT_DEDUP_WINDOW=30
"""


def validate_alerting_config(config: AlertConfiguration) -> List[str]:
    """
    Validate alerting configuration and return list of issues.
    
    Args:
        config: AlertConfiguration to validate
        
    Returns:
        List[str]: List of validation issues (empty if valid)
    """
    issues = []
    
    # Check email configuration
    if config.email_recipients:
        if not config.smtp_username:
            issues.append("SMTP_USERNAME is required when EMAIL_RECIPIENTS is set")
        if not config.smtp_password:
            issues.append("SMTP_PASSWORD is required when EMAIL_RECIPIENTS is set")
        if not config.email_from:
            issues.append("EMAIL_FROM is recommended when using email alerts")
    
    # Check SMS configuration
    if config.sms_recipients:
        if not config.twilio_account_sid:
            issues.append("TWILIO_ACCOUNT_SID is required when SMS_RECIPIENTS is set")
        if not config.twilio_auth_token:
            issues.append("TWILIO_AUTH_TOKEN is required when SMS_RECIPIENTS is set")
        if not config.twilio_from_number:
            issues.append("TWILIO_FROM_NUMBER is required when SMS_RECIPIENTS is set")
    
    # Check webhook URLs
    webhook_configs = [
        ('SLACK_WEBHOOK_URL', config.slack_webhook_url),
        ('DISCORD_WEBHOOK_URL', config.discord_webhook_url),
        ('TEAMS_WEBHOOK_URL', config.teams_webhook_url)
    ]
    
    for name, url in webhook_configs:
        if url and not url.startswith('https://'):
            issues.append(f"{name} should start with 'https://'")
    
    # Check rate limiting values
    if config.rate_limit_window_minutes <= 0:
        issues.append("ALERT_RATE_LIMIT_WINDOW must be positive")
    if config.max_alerts_per_window <= 0:
        issues.append("ALERT_MAX_PER_WINDOW must be positive")
    if config.deduplication_window_minutes <= 0:
        issues.append("ALERT_DEDUP_WINDOW must be positive")
    
    return issues


def get_configured_channels(config: AlertConfiguration) -> List[str]:
    """
    Get list of properly configured alert channels.
    
    Args:
        config: AlertConfiguration to check
        
    Returns:
        List[str]: List of configured channel names
    """
    channels = []
    
    if config.email_recipients and config.smtp_username and config.smtp_password:
        channels.append('email')
    
    if config.slack_webhook_url:
        channels.append('slack')
    
    if (config.sms_recipients and config.twilio_account_sid and 
        config.twilio_auth_token and config.twilio_from_number):
        channels.append('sms')
    
    if config.discord_webhook_url:
        channels.append('discord')
    
    if config.pagerduty_integration_key:
        channels.append('pagerduty')
    
    if config.teams_webhook_url:
        channels.append('teams')
    
    return channels
