/**
 * This script calls the API endpoint to fix contact statuses.
 * Run it with: node scripts/fix-contact-statuses-api.js
 */

import axios from 'axios';

// The API base URL
const API_BASE_URL = process.env.VITE_API_BASE_URL || 'https://crm-2lmw.onrender.com';

async function fixContactStatuses() {
  try {
    console.log('Starting contact status fix via API endpoint');
    console.log(`Using API base URL: ${API_BASE_URL}`);
    
    // Call the API endpoint
    console.log(`Calling API endpoint: ${API_BASE_URL}/api/fix-contact-statuses`);
    const response = await axios.get(`${API_BASE_URL}/api/fix-contact-statuses`);
    
    // Check response
    if (response.status !== 200) {
      console.error(`API returned non-200 status: ${response.status}`);
      console.error(response.data);
      return;
    }
    
    // Display results
    const { message, count, updated } = response.data;
    
    console.log(`\nAPI response: ${message}`);
    console.log(`Updated ${count} contacts`);
    
    // Display details of updated contacts if available
    if (updated && updated.length > 0) {
      console.log('\nUpdated contacts:');
      updated.forEach((contact, index) => {
        console.log(`[${index+1}] ID ${contact.id}: ${contact.first_name} ${contact.last_name}, status=${contact.status}`);
      });
    }
    
    console.log('\nContact status fix completed successfully!');
  } catch (error) {
    console.error('Error fixing contact statuses:', error.message);
    if (error.response) {
      console.error('API response error:', error.response.data);
    }
    console.error('Make sure your server is running and accessible.');
  }
}

fixContactStatuses(); 