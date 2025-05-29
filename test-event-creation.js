// Test script for event creation API
const API_BASE_URL = 'http://localhost:3002';

async function testEventCreation() {
  console.log('Testing event creation API...');
  
  const eventData = {
    type: 'event',
    title: 'Test Event',
    description: 'This is a test event',
    start_datetime: new Date().toISOString(),
    status: 'pending'
  };
  
  console.log('Sending event data:', JSON.stringify(eventData, null, 2));
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/activities`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventData),
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      return;
    }
    
    const result = await response.json();
    console.log('Success response:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Request failed:', error);
  }
}

// Run the test
testEventCreation(); 