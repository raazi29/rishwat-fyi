-- Performance indexes identified by audit (MED-6).
-- These are additive (CREATE INDEX IF NOT EXISTS) and safe to apply to a live database.
-- Expected improvement: aggregation, abuse detection, moderation queue, evidence purge.

-- Highest-leverage: serves aggregates, duplication, abuse, metrics groupBy.
CREATE INDEX IF NOT EXISTS reports_svc_dist_created_idx
  ON reports (service_id, district_id, created_at);

-- Moderation queue: status equality + sort by abuse_score desc, created_at asc.
CREATE INDEX IF NOT EXISTS reports_queue_idx
  ON reports (status, abuse_score, created_at);

-- Unindexed FK: evidence.report_id (cascading delete, admin/moderation subquery).
CREATE INDEX IF NOT EXISTS evidence_report_id_idx
  ON evidence (report_id);

-- Evidence purge: retention.service scans for retention_until < now().
CREATE INDEX IF NOT EXISTS evidence_retention_idx
  ON evidence (retention_until)
  WHERE retention_until IS NOT NULL;

-- Unindexed FK: reports.state_id (joined in export/search/metrics).
CREATE INDEX IF NOT EXISTS reports_state_id_idx
  ON reports (state_id);

-- Abuse service: IP-flood detection.
CREATE INDEX IF NOT EXISTS reports_ip_hash_created_idx
  ON reports (ip_hash, created_at)
  WHERE ip_hash IS NOT NULL;

-- Abuse service: device-flood detection.
CREATE INDEX IF NOT EXISTS reports_device_hash_created_idx
  ON reports (device_fingerprint_hash, created_at)
  WHERE device_fingerprint_hash IS NOT NULL;

-- Offices: locations.ts GET /districts/:id/offices.
CREATE INDEX IF NOT EXISTS offices_district_id_idx
  ON offices (district_id);
