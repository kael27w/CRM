/**
 * This script directly connects to the database to fix contacts with null status.
 * Run it with: node scripts/direct-db-fix.js
 * 
 * You'll need to:
 * 1. npm install @supabase/supabase-js dotenv
 * 2. Create a .env file with your Supabase URL and key
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

// Get credentials from .env file
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing Supabase credentials. Create a .env file with:');
  console.error('SUPABASE_URL=your-supabase-url');
  console.error('SUPABASE_KEY=your-supabase-key');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function fixContactStatuses() {
  try {
    console.log('Connecting to database to fix contacts with null status...');
    
    // Get count of contacts with null status before update
    const { data: beforeCount, error: countError } = await supabase
      .from('contacts')
      .select('id', { count: 'exact', head: true })
      .is('status', null);
    
    if (countError) {
      console.error('Error counting contacts with null status:', countError.message);
      return;
    }
    
    console.log(`Found ${beforeCount} contacts with null status.`);
    
    if (beforeCount === 0) {
      console.log('No contacts need fixing. All contacts already have a status value.');
      return;
    }
    
    // Update contacts with null status
    const { data: updatedContacts, error: updateError } = await supabase
      .from('contacts')
      .update({ 
        status: 'Lead',
        updated_at: new Date().toISOString()
      })
      .is('status', null)
      .select();
    
    if (updateError) {
      console.error('Error updating contacts:', updateError.message);
      return;
    }
    
    const countUpdated = updatedContacts ? updatedContacts.length : 0;
    console.log(`Successfully updated ${countUpdated} contacts with null status to 'Lead'`);
    
    if (countUpdated > 0 && updatedContacts) {
      console.log('First few updated contacts:');
      updatedContacts.slice(0, 3).forEach(contact => {
        console.log(`- ${contact.id}: ${contact.first_name} ${contact.last_name} (${contact.status})`);
      });
    }
    
  } catch (error) {
    console.error('Unexpected error:', error.message);
  }
}

fixContactStatuses(); 