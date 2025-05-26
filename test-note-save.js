const fetch = require('node-fetch');

async function testNoteSave() {
  try {
    console.log('Testing note save functionality...');
    
    // Test data for creating a note
    const noteData = {
      contact_id: 1, // Assuming contact with ID 1 exists
      type: 'note',
      description: 'Test note from API test script',
      title: 'Test Note - ' + new Date().toLocaleString(),
      owner_id: 1
    };
    
    console.log('Sending note data:', JSON.stringify(noteData, null, 2));
    
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
      console.log('✅ Note save test PASSED');
      const parsedData = JSON.parse(responseData);
      console.log('Created note with ID:', parsedData.id);
    } else {
      console.log('❌ Note save test FAILED');
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

async function runTests() {
  console.log('=== API Test Script ===');
  
  const serverRunning = await testServerConnection();
  if (!serverRunning) {
    console.log('Please start the server first with: npm run dev:server');
    return;
  }
  
  await testNoteSave();
}

runTests(); 