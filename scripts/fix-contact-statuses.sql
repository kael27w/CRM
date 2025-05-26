-- SQL script to update contacts with null or 'undefined' status to 'Lead'
-- Run this in the Supabase SQL Editor

-- Count contacts with problematic status before update
SELECT COUNT(*) AS contacts_with_problematic_status_before 
FROM contacts 
WHERE status IS NULL OR status = 'undefined' OR status = '';

-- Update contacts with null status to 'Lead'
UPDATE contacts 
SET 
  status = 'Lead', 
  updated_at = NOW() 
WHERE status IS NULL;

-- Update contacts with 'undefined' status to 'Lead'
UPDATE contacts 
SET 
  status = 'Lead', 
  updated_at = NOW() 
WHERE status = 'undefined';

-- Update contacts with empty string status to 'Lead'
UPDATE contacts 
SET 
  status = 'Lead', 
  updated_at = NOW() 
WHERE status = '';

-- Count remaining contacts with problematic status (should be 0)
SELECT COUNT(*) AS contacts_with_problematic_status_after
FROM contacts 
WHERE status IS NULL OR status = 'undefined' OR status = '';

-- View sample of updated contacts
SELECT id, first_name, last_name, phone, status, updated_at
FROM contacts
WHERE status = 'Lead' 
  AND updated_at > NOW() - INTERVAL '5 minutes'
LIMIT 10; 