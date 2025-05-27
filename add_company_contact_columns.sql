-- Add company and contact text columns to deals table
-- Run this SQL in your Supabase SQL editor

ALTER TABLE deals 
ADD COLUMN IF NOT EXISTS company TEXT,
ADD COLUMN IF NOT EXISTS contact TEXT;

-- Verify the columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'deals' 
AND column_name IN ('company', 'contact'); 