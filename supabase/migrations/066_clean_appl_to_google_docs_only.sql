-- Migration: 066_clean_appl_to_google_docs_only.sql
-- Restricts APPL catalog strictly to items synced from the official APPL Google Sheet (Lampiran B).
-- Any legacy or 16-character MDC item (e.g., D08AA03000L6001XX) mistakenly tagged as APPL is updated to 'cc' (Kontrak Pusat).

UPDATE drugs
SET procurement_vote = 'cc'
WHERE procurement_vote = 'appl'
  AND (sheet_source IS NULL OR sheet_source != 'Lampiran B' OR LENGTH(drug_code) > 15);

UPDATE non_drugs
SET procurement_vote = 'cc'
WHERE procurement_vote = 'appl'
  AND (sheet_source IS NULL OR sheet_source != 'Lampiran B' OR LENGTH(item_code) > 15);
