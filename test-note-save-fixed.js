const fetch = require('node-fetch');

async function testNoteSaveFixed() {
  try {
    console.log('Testing FIXED note save functionality...');
    
    // Test data for creating a note WITHOUT owner_id
    const noteData = {
      contact_id: 1, // Assuming contact with ID 1 exists
      type: 'note',
      description: 'Test note from FIXED API test script - no owner_id',
      title: 'Fixed Test Note - ' + new Date().toLocaleString()
      // Removed owner_id field completely
    };
    
    console.log('Sending FIXED note data:', JSON.stringify(noteData, null, 2));
    
    const response = await fetch('http://localhost:3002/api/activities', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(noteData)
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    const responseData = await response.text();
    console.log('Response body:', responseData);
    
    if (response.ok) {
      console.log('✅ FIXED Note save test PASSED');
      const parsedData = JSON.parse(responseData);
      console.log('Created note with ID:', parsedData.id);
      
      // Test fetching the note back
      console.log('\n--- Testing note retrieval ---');
      const contactActivitiesResponse = await fetch(`http://localhost:3002/api/contacts/1/all-activities`);
      if (contactActivitiesResponse.ok) {
        const activities = await contactActivitiesResponse.json();
        const notes = activities.filter(a => a.type === 'note');
        console.log(`✅ Found ${notes.length} notes for contact 1`);
        const ourNote = notes.find(n => n.details.id === parsedData.id);
        if (ourNote) {
          console.log('✅ Our test note was found in the activities:', ourNote.summary);
        } else {
          console.log('❌ Our test note was not found in the activities');
        }
      } else {
        console.log('❌ Failed to fetch contact activities');
      }
      
    } else {
      console.log('❌ FIXED Note save test FAILED');
      console.log('Error response:', responseData);
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Test if server is running first
async function testServerConnection() {
  try {
    const response = await fetch('http://localhost:3002/api/debug');
    const data = await response.text();
    console.log('✅ Server is running:', data);
    return true;
  } catch (error) {
    console.log('❌ Server is not running:', error.message);
    return false;
  }
}

async function runFixedTests() {
  console.log('=== FIXED API Test Script ===');
  
  const serverRunning = await testServerConnection();
  if (!serverRunning) {
    console.log('Please start the server first with: npm run dev');
    return;
  }
  
  await testNoteSaveFixed();
}

runFixedTests(); 