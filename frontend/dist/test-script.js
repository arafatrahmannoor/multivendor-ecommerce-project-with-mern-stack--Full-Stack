// Comprehensive E-Commerce System Testing Script
// This script tests all role functionalities from the browser console

const API_BASE = 'http://localhost:3000/api';

// Test accounts
const testAccounts = {
    admin: { email: 'admin@example.com', password: 'Admin123!' },
    user: { email: 'test@example.com', password: 'test123' },
    vendor: { email: 'vendor@example.com', password: 'vendor123' }
};

let authTokens = {};

// Helper function to make API calls
async function apiCall(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        }
    };
    
    const response = await fetch(url, { ...defaultOptions, ...options });
    return await response.json();
}

// Login function
async function login(role) {
    const account = testAccounts[role];
    const response = await apiCall('/auth/login', {
        method: 'POST',
        body: JSON.stringify(account)
    });
    
    if (response.token) {
        authTokens[role] = response.token;
        console.log(`✅ ${role.toUpperCase()} login successful`);
        return response;
    } else {
        console.log(`❌ ${role.toUpperCase()} login failed:`, response.message);
        return null;
    }
}

// Test admin functionality
async function testAdminRole() {
    console.log('\n🔵 TESTING ADMIN ROLE');
    console.log('====================');
    
    const loginResult = await login('admin');
    if (!loginResult) return;
    
    const token = authTokens.admin;
    const headers = { 'Authorization': `Bearer ${token}` };
    
    try {
        // Test getting all users
        const usersResponse = await apiCall('/users', { headers });
        console.log(`✅ Admin can view ${usersResponse.data?.length || 0} users`);
        
        // Test getting pending orders
        const ordersResponse = await apiCall('/orders/admin/pending', { headers });
        console.log(`✅ Admin can view ${ordersResponse.data?.orders?.length || 0} pending orders`);
        
        // Test getting all products
        const productsResponse = await apiCall('/products', { headers });
        console.log(`✅ Admin can view ${productsResponse.length || 0} products`);
        
    } catch (error) {
        console.log(`❌ Admin test error:`, error.message);
    }
}

// Test vendor functionality
async function testVendorRole() {
    console.log('\n🟡 TESTING VENDOR ROLE');
    console.log('======================');
    
    const loginResult = await login('vendor');
    if (!loginResult) return;
    
    const token = authTokens.vendor;
    const headers = { 'Authorization': `Bearer ${token}` };
    
    try {
        // Test getting vendor's own products
        const myProductsResponse = await apiCall('/products/my-products', { headers });
        console.log(`✅ Vendor can view ${myProductsResponse.data?.products?.length || 0} own products`);
        
        // Test getting assigned orders
        const assignedOrdersResponse = await apiCall('/orders/vendor/assigned', { headers });
        console.log(`✅ Vendor can view ${assignedOrdersResponse.data?.orders?.length || 0} assigned orders`);
        
        // Test creating a product
        const productData = {
            name: `Test Product ${Date.now()}`,
            description: 'Test product for functionality testing',
            price: 99.99,
            category: 'Electronics',
            brand: 'Test Brand',
            stock: 10
        };
        
        const createProductResponse = await apiCall('/products', {
            method: 'POST',
            headers,
            body: JSON.stringify(productData)
        });
        
        if (createProductResponse.success) {
            console.log(`✅ Vendor can create products`);
        } else {
            console.log(`❌ Vendor product creation failed:`, createProductResponse.message);
        }
        
    } catch (error) {
        console.log(`❌ Vendor test error:`, error.message);
    }
}

// Test user functionality
async function testUserRole() {
    console.log('\n🟢 TESTING USER ROLE');
    console.log('===================');
    
    const loginResult = await login('user');
    if (!loginResult) return;
    
    const token = authTokens.user;
    const headers = { 'Authorization': `Bearer ${token}` };
    
    try {
        // Test getting all products (user view)
        const productsResponse = await apiCall('/products');
        console.log(`✅ User can view ${productsResponse.length || 0} products`);
        
        // Test getting user's orders
        const ordersResponse = await apiCall('/orders/my-orders', { headers });
        console.log(`✅ User can view ${ordersResponse.data?.orders?.length || 0} own orders`);
        
        // Test getting cart
        const cartResponse = await apiCall('/cart', { headers });
        console.log(`✅ User can access cart with ${cartResponse.data?.items?.length || 0} items`);
        
    } catch (error) {
        console.log(`❌ User test error:`, error.message);
    }
}

// Run all tests
async function runAllTests() {
    console.log('🚀 STARTING COMPREHENSIVE E-COMMERCE SYSTEM TESTING');
    console.log('===================================================');
    
    await testAdminRole();
    await testUserRole();
    await testVendorRole();
    
    console.log('\n🏁 TESTING COMPLETE');
    console.log('===================');
    console.log('Check the logs above for detailed results.');
}

// Export for use
window.ecommerceTest = {
    runAllTests,
    testAdminRole,
    testUserRole,
    testVendorRole,
    login,
    apiCall
};

console.log('🔧 E-commerce testing script loaded!');
console.log('Run: ecommerceTest.runAllTests() to start comprehensive testing');
