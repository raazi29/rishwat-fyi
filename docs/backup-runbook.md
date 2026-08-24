# Backup & Disaster Recovery Runbook

This document covers backup strategy, restoration procedures, and disaster
recovery for the Rishwat.fyi production deployment.

## Database (Supabase)

### Automatic backups

Supabase provides:

- **Point-in-Time Recovery (PITR):** Available on Pro plan and above. Allows
  restoring the database to any point within the retention window.
- **Daily backups:** Available on all paid plans. Retained for 7 days (Pro) or
  30 days (Team/Enterprise).
- **Free plan:** Daily backups retained for 7 days, no PITR.

Verify your plan's backup status at:
`Dashboard → Project → Database → Backups`

### Manual backup (pg_dump)

For an independent backup outside Supabase:

```bash
# Direct connection (not pooled — pg_dump needs direct)
pg_dump "$DIRECT_DATABASE_URL" \
  --format=custom \
  --no-owner \
  --no-privileges \
  -f rishwat-backup-$(date +%Y%m%d).dump
```

Schedule weekly via cron or a GitHub Action. Store dumps in a separate cloud
storage bucket (not the same Supabase project).

### Restoration

```bash
# Restore to a fresh database
pg_restore --clean --if-exists \
  -d "$TARGET_DATABASE_URL" \
  rishwat-backup-YYYYMMDD.dump

# Then re-run extensions and triggers (not in pg_dump output)
npm run db:migrate
```

## Evidence storage (Supabase Storage)

Evidence files are stored in a private Supabase Storage bucket (`evidence`).
Supabase does not automatically back up storage objects.

- Evidence has a **90-day retention** (privacy.md commitment). After 90 days
  the purge job deletes both the file and the database row.
- For the 90-day window, evidence exists only in the Supabase bucket. If the
  bucket is lost, accepted evidence cannot be recovered.
- Mitigation: the dataset and all published statistics are computed from
  database columns alone, never from evidence files. Evidence loss does not
  corrupt the public dataset.

## Dataset exports

Dataset exports (CSV/JSON) are regenerated on demand and are fully reproducible
from the database. They are not a backup target — they are a backup *source*:
any mirror holding a recent export preserves the public dataset independently.

## Source code

The full repository is on GitHub. For additional redundancy, maintain a mirror
on a separate git host (GitLab, Codeberg, or a self-hosted Gitea instance).

## Disaster recovery scenarios

| Scenario | Recovery |
| --- | --- |
| API host (Render) down | Redeploy on another PaaS (Dockerfile is portable) |
| Web host (Vercel) down | Redeploy on Netlify/Cloudflare Pages (Next.js is portable) |
| Database corruption | Restore from Supabase PITR or manual pg_dump |
| Supabase project suspended | Restore pg_dump to any Postgres host; update DATABASE_URL |
| GitHub repo deleted | Restore from mirror; any local clone is a full backup |
| Domain seized/expired | Dataset exports + mirrors preserve data; redeploy on new domain |
| Operator incapacitated | Public repo + mirrors + CC BY 4.0 data = community can fork |

## Monitoring backup health

- Check Supabase backup status weekly (Dashboard → Backups)
- If using manual pg_dump, verify the dump size hasn't dropped to zero
- Test a restore to a scratch database quarterly
