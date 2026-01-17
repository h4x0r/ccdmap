# Concordium Node Map - Project Instructions

## Vercel Pro Plan + Fluid Compute

**IMPORTANT**: This project uses Vercel Pro plan.

### Current Status (2026-01-17)

**Fluid Compute is NOT currently working** despite settings. Investigation findings:
- `"fluid": true` is set in vercel.json ✓
- Dashboard says Fluid Compute is enabled ✓
- **BUT**: Functions still timeout at exactly 60s (Hobby plan limit!)

### What's Currently Working
- **Cron**: Uses `/api/cron/poll-nodes-simple` (completes in ~47s)
- **Simple endpoint**: Tracks nodes, calculates metrics, NO validators
- **Full endpoint**: Times out at 60s (needs Fluid Compute to work)

### To Enable Validators (Requires Working Fluid Compute)

1. Go to Vercel Dashboard → Project Settings → Functions
2. Find "Function Max Duration" and set to 300
3. Verify Fluid Compute toggle is ON
4. Redeploy
5. Test: `vercel curl /api/cron/poll-nodes -- --header "Authorization: Bearer $CRON_SECRET"`
6. If it completes (not 60s timeout), change cron path to `/api/cron/poll-nodes`

### Duration Limits Reference
| Fluid Compute | Plan | Default | Maximum |
|---------------|------|---------|---------|
| **Enabled**   | Pro  | 300s    | 800s    |
| **Disabled**  | Pro  | 15s     | 300s    |
| **Disabled**  | Hobby| 10s     | 60s     |

### Debug Environment Variables
- `SKIP_VALIDATORS=true` - Skip validator gRPC calls
- `SKIP_GRPC_PEERS=true` - Skip peer gRPC calls

## Vercel Environment Variables

**IMPORTANT**: When environment variables need to be added to Vercel, do NOT tell the user to do it. Add them directly using the Vercel CLI which is already authenticated.

### How to add environment variables to Vercel:

```bash
# Use printf to pipe the value and handle interactive prompts
printf '%s\nn\n' 'your-secret-value' | vercel env add VAR_NAME production
printf '%s\nn\n' 'your-secret-value' | vercel env add VAR_NAME preview

# Verify with
vercel env ls
```

The 'n' after the value answers "no" to the "Mark as sensitive?" prompt.

### Current Environment Variables:
- `TURSO_DATABASE_URL` - Turso database connection URL
- `TURSO_AUTH_TOKEN` - Turso authentication token
- `CRON_SECRET` - Secret for authenticating cron job requests

## Technology Stack

- **Framework**: Next.js 16 with App Router
- **Database**: Turso (libSQL edge database)
- **Styling**: Tailwind CSS
- **Testing**: Vitest
- **Deployment**: Vercel Pro with Cron Jobs (300s function limit)

## Development Commands

```bash
# Development
pnpm dev

# Testing
pnpm test:run

# Build
pnpm build
```
