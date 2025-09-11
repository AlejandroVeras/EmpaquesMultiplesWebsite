# Supabase Edge Functions Configuration

This directory contains Edge Functions for the lunch registration system.

## Functions

### daily-report
- **Purpose**: Generate daily lunch registration reports
- **Schedule**: Run daily at end of business day
- **Features**: 
  - Counts total registrations for the day
  - Breaks down by department
  - Generates detailed report
  - Can be configured to send email reports

### monthly-backup
- **Purpose**: Create monthly backups of all system data
- **Schedule**: Run monthly at month end
- **Features**:
  - Backs up all lunch records for the month
  - Includes user and department data
  - Generates statistics and summaries
  - Stores backup in Supabase Storage

## Deployment

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Deploy functions
supabase functions deploy daily-report
supabase functions deploy monthly-backup
```

## Scheduling

To run these functions automatically, you can:

1. **Use cron jobs** on your server
2. **Use GitHub Actions** with scheduled workflows
3. **Use external services** like Zapier or Make
4. **Set up webhooks** from external cron services

Example cron jobs:
```bash
# Daily report at 6 PM
0 18 * * * curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/daily-report

# Monthly backup on last day of month at 11 PM
0 23 28-31 * * [ $(date -d tomorrow +\%d) = "01" ] && curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/monthly-backup
```

## Environment Variables

Set these in your Supabase project:
- `SUPABASE_URL`: Your project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key for admin access

## Email Integration

To enable email reports in the daily-report function, integrate with:
- SendGrid
- Resend
- AWS SES
- Mailgun

Add your email service API key to environment variables and update the function code.