/**
 * Test API Script - Verify Contact Status Values
 * 
 * This script fetches contacts from the API and checks their status values.
 */

import fetch from 'node-fetch';

// Get the API URL from environment or use default
const API_BASE_URL = process.env.VITE_API_BASE_URL || 'https://crm-2lmw.onrender.com';

async function testContactsAPI() {
  console.log(`Testing API at: ${API_BASE_URL}`);
  
  try {
    // Test the contacts list endpoint
    console.log('Fetching contacts from API...');
    const contactsResponse = await fetch(`${API_BASE_URL}/api/contacts/list`);
    
    if (!contactsResponse.ok) {
      console.error(`API error: ${contactsResponse.status} ${contactsResponse.statusText}`);
      return;
    }
    
    const contacts = await contactsResponse.json();
    
    if (!contacts || contacts.length === 0) {
      console.log('No contacts returned from API.');
      return;
    }
    
    console.log(`Found ${contacts.length} contacts from API.`);
    console.log('Status values for each contact:');
    
    contacts.forEach(contact => {
      console.log(`- ID ${contact.id}: ${contact.first_name} ${contact.last_name}, status=${contact.status === null ? 'NULL' : `"${contact.status}"`}`);
    });
    
    // Check for any invalid status values
    const invalidContacts = contacts.filter(contact => !contact.status || contact.status === 'undefined' || contact.status === '' || contact.status === 'null');
    
    if (invalidContacts.length > 0) {
      console.error(`PROBLEM: Found ${invalidContacts.length} contacts with invalid status values:`);
      invalidContacts.forEach(contact => {
        console.error(`- ID ${contact.id}: ${contact.first_name} ${contact.last_name}, status=${contact.status === null ? 'NULL' : `"${contact.status}"`}`);
      });
    } else {
      console.log('SUCCESS: All contacts have valid status values.');
    }
    
    // Print the distribution of status values
    const statusCounts = {};
    contacts.forEach(contact => {
      const status = contact.status || 'NULL';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    
    console.log('Status distribution:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`- ${status}: ${count} contacts`);
    });
    
  } catch (error) {
    console.error('Error testing API:', error.message);
    console.error(error.stack);
  }
}

// Run the test
testContactsAPI()
  .then(() => {
    console.log('API test completed');
  })
  .catch(error => {
    console.error('Test failed with error:', error);
    process.exit(1);
  }); 