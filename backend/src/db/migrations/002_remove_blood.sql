-- ============================================================================
-- Migration 002: Remove blood functionality from the database
-- Non-destructive to all other tables. Drops only blood-specific structures.
-- ============================================================================

-- Intelligence-layer table that stored blood shortage predictions
DROP TABLE IF EXISTS blood_demand_predictions;

-- Core blood inventory table from the original dump
DROP TABLE IF EXISTS blood_inventory;

-- Purge historical blood-agent activity so no blood references remain in logs
DELETE FROM ai_agent_logs WHERE agent_id = 'blood' OR agent_name LIKE '%Blood%';
