-- Migration: 065_fix_appl_drug_codes.sql
-- Enforces strict APPL Google Sheets format rules:
-- 1. All APPL Drugs must have drug_code starting with 'D' (e.g., D02.0001.03)
-- 2. All APPL Non-Drugs must have item_code starting with 'N' (e.g., N01.0001.01)
-- 3. Any non-D item (e.g., S01EC01000T1001XX MDC code) erroneously tagged as 'appl' is updated to 'cc' (Kontrak Pusat / MDC)

UPDATE drugs
SET procurement_vote = 'cc'
WHERE procurement_vote = 'appl'
  AND drug_code NOT LIKE 'D%';

UPDATE non_drugs
SET procurement_vote = 'cc'
WHERE procurement_vote = 'appl'
  AND item_code NOT LIKE 'N%';
