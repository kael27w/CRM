// Test script for event creation API
const API_BASE_URL = 'https://crm-2lmw.onrender.com';

async function testTaskCreation() {
  console.log('\n=== Testing Task Creation ===');
  
  const taskData = {
    type: 'task',
    title: 'Test Task - Database Fix',
    description: 'Testing that tasks can be created without start_datetime errors',
    due_date: '2024-02-15T10:00:00.000Z',
    priority: 'medium',
    completed: false,
    status: 'pending'
  };
  
  console.log('Task payload:', JSON.stringify(taskData, null, 2));
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/activities`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(taskData),
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Task creation failed:', response.status, errorText);
      return false;
    }
    
    const result = await response.json();
    console.log('Task created successfully:', result);
    return true;
  } catch (error) {
    console.error('Task creation error:', error);
    return false;
  }
}

async function testEventCreation() {
  console.log('\n=== Testing Event Creation ===');
  
  const eventData = {
    type: 'event',
    title: 'Test Event - Database Fix',
    description: 'Testing that events can be created with correct type validation',
    start_datetime: '2024-02-15T14:00:00.000Z',
    end_datetime: '2024-02-15T15:00:00.000Z',
    location: 'Test Location',
    status: 'pending'
  };
  
  console.log('Event payload:', JSON.stringify(eventData, null, 2));
  
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
      console.error('Event creation failed:', response.status, errorText);
      return false;
    }
    
    const result = await response.json();
    console.log('Event created successfully:', result);
    return true;
  } catch (error) {
    console.error('Event creation error:', error);
    return false;
  }
}

async function runTests() {
  console.log('Starting Task and Event Creation Tests...');
  console.log('API Base URL:', API_BASE_URL);
  
  const taskSuccess = await testTaskCreation();
  const eventSuccess = await testEventCreation();
  
  console.log('\n=== Test Results ===');
  console.log('Task Creation:', taskSuccess ? '✅ PASSED' : '❌ FAILED');
  console.log('Event Creation:', eventSuccess ? '✅ PASSED' : '❌ FAILED');
  
  if (taskSuccess && eventSuccess) {
    console.log('\n🎉 All tests passed! Database errors have been fixed.');
  } else {
    console.log('\n⚠️  Some tests failed. Check the error messages above.');
  }
}

runTests(); 