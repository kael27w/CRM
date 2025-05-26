/**
 * Fix Contact Statuses Script
 * 
 * This script fixes any NULL, undefined, or empty status values in the contacts table.
 * It updates them to have a default value of 'Lead'.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Initialize environment variables
dotenv.config();

// Get script directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;

// Use the credentials directly from the supabase.ts file
const hardcodedUrl = 'https://jsgdcnvoargsjozhzvso.supabase.co';
const hardcodedKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpzZ2RjbnZvYXJnc2pvemh6dnNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM5ODQ2NjEsImV4cCI6MjA1OTU2MDY2MX0.8fQeosEUTh7DGaVeGJkWH8l9jzRH5oXaNAJWuimHnV8';

// Use either the env variables or hardcoded values
const finalUrl = supabaseUrl || hardcodedUrl;
const finalKey = supabaseKey || hardcodedKey;

console.log(`Connecting to Supabase at: ${finalUrl}`);
const supabase = createClient(finalUrl, finalKey);

async function fixContactStatuses() {
  console.log('Starting to fix contacts with invalid status values...');
  
  try {
    // First, log all contacts to see what's in the database
    console.log('Listing all contacts and their status values:');
    const { data: allContacts, error: allContactsError } = await supabase
      .from('contacts')
      .select('id, first_name, last_name, status')
      .order('id', { ascending: true });
    
    if (allContactsError) {
      console.error('Error fetching all contacts:', allContactsError);
      return;
    }
    
    if (!allContacts || allContacts.length === 0) {
      console.log('No contacts found in the database.');
      return;
    }
    
    console.log(`Found ${allContacts.length} total contacts in the database.`);
    allContacts.forEach(contact => {
      console.log(`- ID ${contact.id}: ${contact.first_name} ${contact.last_name}, status=${contact.status === null ? 'NULL' : `"${contact.status}"`}`);
    });
    
    // Now look for contacts with invalid status values
    const { data: contactsWithInvalidStatus, error: fetchError } = await supabase
      .from('contacts')
      .select('id, first_name, last_name, status')
      .or('status.is.null,status.eq.undefined,status.eq.,status.eq.null');
    
    if (fetchError) {
      console.error('Error fetching contacts with invalid status:', fetchError);
      return;
    }
    
    const invalidCount = contactsWithInvalidStatus ? contactsWithInvalidStatus.length : 0;
    console.log(`Found ${invalidCount} contacts with invalid status.`);
    
    if (!contactsWithInvalidStatus || contactsWithInvalidStatus.length === 0) {
      console.log('No contacts with invalid status found. All contacts have valid status values.');
      return;
    }
    
    // Log the contacts that will be updated
    console.log('Contacts to be updated:');
    contactsWithInvalidStatus.forEach(contact => {
      console.log(`- ID ${contact.id}: ${contact.first_name} ${contact.last_name}, current status=${contact.status === null ? 'NULL' : `"${contact.status}"`}`);
    });
    
    // Update all contacts with invalid status to have a default value of 'Lead'
    const { data: updatedContacts, error: updateError } = await supabase
      .from('contacts')
      .update({ 
        status: 'Lead',
        updated_at: new Date().toISOString()
      })
      .or('status.is.null,status.eq.undefined,status.eq.,status.eq.null')
      .select();
    
    if (updateError) {
      console.error('Error updating contacts with invalid status:', updateError);
      return;
    }
    
    const countUpdated = updatedContacts ? updatedContacts.length : 0;
    console.log(`Successfully updated ${countUpdated} contacts with invalid status to 'Lead'`);
    
    if (countUpdated > 0 && updatedContacts) {
      console.log('Updated contacts:');
      updatedContacts.forEach(contact => {
        console.log(`- ID ${contact.id}: ${contact.first_name} ${contact.last_name}, new status=${contact.status}`);
      });
    }
    
    // Verify the fix by fetching all contacts again
    console.log('Verifying the fix by listing all contacts again:');
    const { data: verifyContacts, error: verifyError } = await supabase
      .from('contacts')
      .select('id, first_name, last_name, status')
      .order('id', { ascending: true });
    
    if (verifyError) {
      console.error('Error verifying fix:', verifyError);
      return;
    }
    
    if (!verifyContacts || verifyContacts.length === 0) {
      console.log('No contacts found during verification.');
      return;
    }
    
    console.log(`Verification: Found ${verifyContacts.length} total contacts in the database.`);
    let stillInvalid = 0;
    verifyContacts.forEach(contact => {
      const isInvalid = !contact.status || contact.status === 'undefined' || contact.status === '' || contact.status === 'null';
      console.log(`- ID ${contact.id}: ${contact.first_name} ${contact.last_name}, status=${contact.status === null ? 'NULL' : `"${contact.status}"`}${isInvalid ? ' (STILL INVALID!)' : ''}`);
      if (isInvalid) stillInvalid++;
    });
    
    if (stillInvalid > 0) {
      console.error(`VERIFICATION FAILED: Found ${stillInvalid} contacts still with invalid status values.`);
    } else {
      console.log('VERIFICATION SUCCESSFUL: All contacts now have valid status values.');
    }
    
  } catch (error) {
    console.error('Unexpected error:', error.message, error.stack);
  }
}

// Run the function
fixContactStatuses()
  .then(() => {
    console.log('Script completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('Script failed with error:', error);
    process.exit(1);
  }); 