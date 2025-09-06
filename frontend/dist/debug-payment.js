// Debug script to test payment endpoint step by step
// Paste this into browser console at http://localhost:5173

console.log('🔧 Starting payment endpoint debugging...');

// Step 1: Test basic connectivity
async function testConnectivity() {
    console.log('\n1️⃣ Testing basic connectivity...');
    try {
        const response = await fetch('http://localhost:3000/api/health', {
            method: 'GET',
            mode: 'cors'
        });
        const data = await response.json();
        console.log('✅ Health check successful:', data);
        return true;
    } catch (error) {
        console.log('❌ Health check failed:', error.message);
        return false;
    }
}

// Step 2: Test CORS preflight
async function testCORSPreflight() {
    console.log('\n2️⃣ Testing CORS preflight...');
    try {
        const response = await fetch('http://localhost:3000/api/payment/initialize', {
            method: 'OPTIONS',
            mode: 'cors',
            headers: {
                'Access-Control-Request-Method': 'POST',
                'Access-Control-Request-Headers': 'Content-Type,Authorization'
            }
        });
        console.log('✅ CORS preflight successful:', response.status, response.statusText);
        return true;
    } catch (error) {
        console.log('❌ CORS preflight failed:', error.message);
        return false;
    }
}

// Step 3: Test authentication
async function testAuthentication() {
    console.log('\n3️⃣ Testing authentication...');
    
    // Get token from localStorage or auth store
    let token = localStorage.getItem('auth-token');
    if (!token) {
        // Try to get from auth store
        const authData = localStorage.getItem('auth-storage');
        if (authData) {
            const parsed = JSON.parse(authData);
            token = parsed?.state?.token;
        }
    }
    
    if (!token) {
        console.log('❌ No auth token found. Please login first.');
        return false;
    }
    
    console.log('📝 Found token:', token.substring(0, 20) + '...');
    
    try {
        const response = await fetch('http://localhost:3000/api/users/profile', {
            method: 'GET',
            mode: 'cors',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Authentication successful for user:', data.data?.user?.name);
            return token;
        } else {
            console.log('❌ Authentication failed:', response.status, response.statusText);
            return false;
        }
    } catch (error) {
        console.log('❌ Authentication test failed:', error.message);
        return false;
    }
}

// Step 4: Test payment endpoint with minimal data
async function testPaymentEndpoint(token) {
    console.log('\n4️⃣ Testing payment endpoint...');
    
    const testPayload = {
        useCart: false,
        items: [
            {
                productId: '507f1f77bcf86cd799439011', // dummy ID for testing
                quantity: 1,
                price: 10.00
            }
        ],
        shippingAddress: {
            fullName: 'Test User',
            phone: '1234567890',
            address: '123 Test St',
            city: 'Test City',
            zipCode: '12345',
            country: 'Bangladesh'
        },
        paymentMethod: 'sslcommerz'
    };
    
    try {
        const response = await fetch('http://localhost:3000/api/payment/initialize', {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(testPayload)
        });
        
        console.log('📡 Response status:', response.status, response.statusText);
        console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Payment endpoint successful:', data);
            return true;
        } else {
            const errorData = await response.text();
            console.log('❌ Payment endpoint failed:', errorData);
            return false;
        }
    } catch (error) {
        console.log('❌ Payment endpoint error:', error.message);
        return false;
    }
}

// Run all tests
async function runAllTests() {
    console.log('🚀 Running comprehensive payment debugging tests...\n');
    
    const connectivityOK = await testConnectivity();
    if (!connectivityOK) {
        console.log('\n❌ Basic connectivity failed. Check if backend is running on port 3000.');
        return;
    }
    
    const corsOK = await testCORSPreflight();
    if (!corsOK) {
        console.log('\n❌ CORS preflight failed. Check CORS configuration.');
        return;
    }
    
    const token = await testAuthentication();
    if (!token) {
        console.log('\n❌ Authentication failed. Please login first.');
        return;
    }
    
    const paymentOK = await testPaymentEndpoint(token);
    if (paymentOK) {
        console.log('\n🎉 All tests passed! Payment endpoint is working correctly.');
    } else {
        console.log('\n❌ Payment endpoint failed. Check backend logs for details.');
    }
}

// Export for manual testing
window.debugPayment = {
    runAllTests,
    testConnectivity,
    testCORSPreflight,
    testAuthentication,
    testPaymentEndpoint
};

console.log('🔧 Debug script loaded! Run debugPayment.runAllTests() to start.');

// Auto-run the tests
runAllTests();
