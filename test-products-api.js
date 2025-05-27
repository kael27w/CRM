const fetch = require('node-fetch');

async function testProductsAPI() {
  const baseUrl = 'http://localhost:3002';
  
  console.log('=== Testing Products API ===\n');
  
  // Test 1: Check if server is running
  try {
    console.log('1. Testing server connection...');
    const response = await fetch(`${baseUrl}/api/debug`);
    if (response.ok) {
      console.log('✅ Server is running\n');
    } else {
      console.log('❌ Server responded with error:', response.status);
      return;
    }
  } catch (error) {
    console.log('❌ Server is not running:', error.message);
    console.log('Please start the server with: npm run dev\n');
    return;
  }
  
  // Test 2: GET /api/products (should return empty array initially)
  try {
    console.log('2. Testing GET /api/products...');
    const response = await fetch(`${baseUrl}/api/products`);
    
    if (response.ok) {
      const products = await response.json();
      console.log(`✅ GET /api/products successful - Found ${products.length} products`);
      console.log('Products:', JSON.stringify(products, null, 2));
    } else {
      const errorText = await response.text();
      console.log('❌ GET /api/products failed:', response.status, errorText);
    }
  } catch (error) {
    console.log('❌ GET /api/products error:', error.message);
  }
  
  console.log('');
  
  // Test 3: POST /api/products (create a test product)
  try {
    console.log('3. Testing POST /api/products...');
    
    const testProduct = {
      product_name: 'Test Life Insurance',
      sku_code: 'TEST-001',
      category: 'Life Insurance',
      price: 299.99,
      status: 'active',
      description: 'Test product created by API test script'
    };
    
    console.log('Sending test product:', JSON.stringify(testProduct, null, 2));
    
    const response = await fetch(`${baseUrl}/api/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testProduct)
    });
    
    if (response.ok) {
      const createdProduct = await response.json();
      console.log('✅ POST /api/products successful');
      console.log('Created product:', JSON.stringify(createdProduct, null, 2));
      
      // Test 4: GET /api/products again to see the new product
      console.log('\n4. Testing GET /api/products after creation...');
      const getResponse = await fetch(`${baseUrl}/api/products`);
      if (getResponse.ok) {
        const products = await getResponse.json();
        console.log(`✅ GET /api/products successful - Now found ${products.length} products`);
        const ourProduct = products.find(p => p.sku_code === 'TEST-001');
        if (ourProduct) {
          console.log('✅ Our test product was found in the list');
        } else {
          console.log('❌ Our test product was not found in the list');
        }
      }
      
    } else {
      const errorText = await response.text();
      console.log('❌ POST /api/products failed:', response.status, errorText);
    }
  } catch (error) {
    console.log('❌ POST /api/products error:', error.message);
  }
  
  console.log('\n=== Products API Test Complete ===');
}

// Test if server is running first
async function checkServer() {
  try {
    const response = await fetch('http://localhost:3002/api/debug');
    return response.ok;
  } catch (error) {
    return false;
  }
}

async function runTests() {
  const serverRunning = await checkServer();
  if (!serverRunning) {
    console.log('❌ Server is not running. Please start it with: npm run dev');
    console.log('Waiting 10 seconds and trying again...');
    
    // Wait 10 seconds and try again
    await new Promise(resolve => setTimeout(resolve, 10000));
    const serverRunningAgain = await checkServer();
    if (!serverRunningAgain) {
      console.log('❌ Server still not running. Exiting.');
      return;
    }
  }
  
  await testProductsAPI();
}

runTests(); 