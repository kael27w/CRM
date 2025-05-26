/**
 * This script directly updates contacts with null status via the API.
 * Run it with: node scripts/fix-contact-statuses-direct.js
 */

import axios from 'axios';

// The API base URL
const API_BASE_URL = process.env.VITE_API_BASE_URL || 'https://crm-2lmw.onrender.com';

// Valid status values
const validStatuses = ["Lead", "Prospect", "Active Client", "Inactive Client", "Client"];

async function fixContactStatusesDirect() {
  try {
    console.log('Starting direct fix of contact statuses');
    console.log(`Using API base URL: ${API_BASE_URL}`);
    
    // Step 1: Get all contacts
    console.log('Fetching all contacts...');
    const contactsResponse = await axios.get(`${API_BASE_URL}/api/contacts/list`);
    const contacts = contactsResponse.data;
    
    console.log(`Fetched ${contacts.length} contacts`);
    
    // Step 2: Analyze all contact statuses
    console.log('\nAnalyzing contact statuses:');
    contacts.forEach((contact, index) => {
      console.log(`[${index+1}] Contact ID ${contact.id}: ${contact.first_name} ${contact.last_name}`);
      console.log(`    Status: ${contact.status === null ? 'NULL' : `"${contact.status}"`}, Type: ${typeof contact.status}`);
    });
    
    // Step 3: Find contacts with invalid status
    const contactsWithInvalidStatus = contacts.filter(contact => 
      contact.status === null || 
      contact.status === '' || 
      !validStatuses.includes(contact.status)
    );
    
    console.log(`\nFound ${contactsWithInvalidStatus.length} contacts with invalid status`);
    
    if (contactsWithInvalidStatus.length === 0) {
      console.log('No contacts need fixing. Exiting.');
      return;
    }
    
    console.log('\nContacts with invalid status:');
    contactsWithInvalidStatus.forEach((contact, index) => {
      console.log(`[${index+1}] Contact ID ${contact.id}: ${contact.first_name} ${contact.last_name}`);
      console.log(`    Current status: ${contact.status === null ? 'NULL' : `"${contact.status}"`}`);
    });
    
    // Ask for confirmation before updating
    console.log('\nAbout to update these contacts with status="Lead"');
    console.log('Proceeding in 3 seconds...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Step 4: Update each contact with invalid status
    console.log('\nUpdating contacts with invalid status...');
    let successCount = 0;
    let failCount = 0;
    
    for (const contact of contactsWithInvalidStatus) {
      try {
        console.log(`Updating contact ${contact.id}: ${contact.first_name} ${contact.last_name}`);
        
        await axios.patch(`${API_BASE_URL}/api/contacts/${contact.id}`, {
          status: 'Lead'
        });
        
        console.log(`✅ Successfully updated contact ${contact.id}`);
        successCount++;
      } catch (error) {
        console.error(`❌ Failed to update contact ${contact.id}:`, error.message);
        failCount++;
      }
    }
    
    console.log('\nSummary:');
    console.log(`Total contacts with invalid status: ${contactsWithInvalidStatus.length}`);
    console.log(`Successfully updated: ${successCount}`);
    console.log(`Failed to update: ${failCount}`);
    
    if (failCount > 0) {
      console.log('\nSome contacts could not be updated. You may need to update them manually or check the server logs.');
    } else if (successCount > 0) {
      console.log('\nAll contacts with invalid status have been fixed!');
    }
  } catch (error) {
    console.error('Error fixing contact statuses:', error.message);
    console.error('Make sure your server is running and accessible.');
  }
}

fixContactStatusesDirect(); 