/**
 * This script uses the Supabase JS client to run a raw SQL query to fix contact statuses.
 * Run it with: node scripts/raw-sql-fix.js
 * 
 * You'll need to:
 * 1. npm install @supabase/supabase-js dotenv
 * 2. Create a .env file with your Supabase URL and key
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

// Get credentials from .env file
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY || process.env.VITE_SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing Supabase credentials. Create a .env file with:');
  console.error('SUPABASE_URL=your-supabase-url');
  console.error('SUPABASE_KEY=your-service-role-key-or-anon-key');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function fixStatusesWithRawSQL() {
  try {
    console.log('Connecting to database to fix contacts with invalid status...');
    
    // Execute SQL query to fix contact statuses
    const query = `
      -- First, check contacts with problematic status
      SELECT id, first_name, last_name, status FROM contacts 
      WHERE status IS NULL OR status = 'undefined' OR status = '';
    `;
    
    // Execute the query to check contacts
    const { data: contactsToFix, error: checkError } = await supabase.rpc('pgSQL', { query });
    
    if (checkError) {
      console.error('Error checking contacts with invalid status:', checkError.message);
      return;
    }
    
    console.log(`Found ${contactsToFix?.length || 0} contacts with invalid status:`);
    contactsToFix?.forEach(contact => {
      console.log(`- ID ${contact.id}: ${contact.first_name} ${contact.last_name}, status=${contact.status}`);
    });
    
    if (!contactsToFix || contactsToFix.length === 0) {
      console.log('No contacts need fixing. All contacts already have a valid status value.');
      return;
    }
    
    // Ask for confirmation
    console.log('\nAbout to update these contacts with status="Lead"');
    console.log('Proceeding in 3 seconds...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Execute SQL query to update contacts
    const updateQuery = `
      -- Update contacts with null status
      UPDATE contacts 
      SET status = 'Lead', updated_at = NOW()
      WHERE status IS NULL OR status = 'undefined' OR status = '';
      
      -- Return the number of rows updated
      SELECT COUNT(*) as updated_count 
      FROM contacts 
      WHERE status = 'Lead' AND updated_at > NOW() - interval '1 minute';
    `;
    
    // Execute the update query
    const { data: updateResult, error: updateError } = await supabase.rpc('pgSQL', { query: updateQuery });
    
    if (updateError) {
      console.error('Error updating contacts:', updateError.message);
      return;
    }
    
    const updatedCount = updateResult?.[0]?.updated_count || 0;
    console.log(`Successfully updated ${updatedCount} contacts with invalid status to 'Lead'`);
    
  } catch (error) {
    console.error('Unexpected error:', error.message);
  }
}

fixStatusesWithRawSQL(); 