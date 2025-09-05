const axios = require('axios');

// Test base URL
const BASE_URL = 'http://localhost:5000';

// Test user data
const testUser = {
  name: 'Test User',
  email: 'test@example.com',
  password: 'password123',
  mobile: '1234567890'
};

// Test plan ID
const testPlanId = 1;

// Test withdrawal data
const testWithdrawal = {
  amount: 1000,
  method: 'bank',
  details: 'Test Bank Account'
};

// Test recharge data
const testRecharge = {
  amount: 5000,
  utr: 'TESTUTR1234567890'
};

async function testAPI() {
  try {
    console.log('Testing Investment Platform API...');
    
    // 1. Register a new user
    console.log('\n1. Testing user registration...');
    const registerResponse = await axios.post(`${BASE_URL}/api/register`, testUser);
    console.log('Registration response:', registerResponse.data);
    
    const token = registerResponse.data.token;
    const userId = registerResponse.data.user.id;
    
    // 2. Login with the same user
    console.log('\n2. Testing user login...');
    const loginResponse = await axios.post(`${BASE_URL}/api/login`, {
      email: testUser.email,
      password: testUser.password
    });
    console.log('Login response:', loginResponse.data);
    
    // 3. Get user data
    console.log('\n3. Testing user data retrieval...');
    const userDataResponse = await axios.get(`${BASE_URL}/api/data`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log('User data response:', userDataResponse.data);
    
    // 4. Get product plans
    console.log('\n4. Testing product plans retrieval...');
    const productPlansResponse = await axios.get(`${BASE_URL}/api/product-plans`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log('Product plans response:', productPlansResponse.data);
    
    // 5. Purchase a product plan
    console.log('\n5. Testing product plan purchase...');
    const purchaseResponse = await axios.post(`${BASE_URL}/api/purchase-plan`, 
      { planId: testPlanId },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    console.log('Purchase response:', purchaseResponse.data);
    
    // 6. Get user investments
    console.log('\n6. Testing user investments retrieval...');
    const investmentsResponse = await axios.get(`${BASE_URL}/api/investments`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log('Investments response:', investmentsResponse.data);
    
    // 7. Request a withdrawal
    console.log('\n7. Testing withdrawal request...');
    const withdrawalResponse = await axios.post(`${BASE_URL}/api/withdraw`, 
      testWithdrawal,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    console.log('Withdrawal response:', withdrawalResponse.data);
    
    // 8. Get user withdrawals
    console.log('\n8. Testing user withdrawals retrieval...');
    const withdrawalsResponse = await axios.get(`${BASE_URL}/api/withdrawals`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log('Withdrawals response:', withdrawalsResponse.data);
    
    // 9. Request a recharge
    console.log('\n9. Testing recharge request...');
    const rechargeResponse = await axios.post(`${BASE_URL}/api/recharge`, 
      testRecharge,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    console.log('Recharge response:', rechargeResponse.data);
    
    // 10. Get user recharges
    console.log('\n10. Testing user recharges retrieval...');
    const rechargesResponse = await axios.get(`${BASE_URL}/api/recharges`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log('Recharges response:', rechargesResponse.data);
    
    // 11. Get marketing stats
    console.log('\n11. Testing marketing stats retrieval...');
    const marketingStatsResponse = await axios.get(`${BASE_URL}/api/marketing-stats`);
    console.log('Marketing stats response:', marketingStatsResponse.data);
    
    // 12. Get fake withdrawal
    console.log('\n12. Testing fake withdrawal generation...');
    const fakeWithdrawalResponse = await axios.get(`${BASE_URL}/api/fake-withdrawal`);
    console.log('Fake withdrawal response:', fakeWithdrawalResponse.data);
    
    // 13. Get UPI ID
    console.log('\n13. Testing UPI ID retrieval...');
    const upiIdResponse = await axios.get(`${BASE_URL}/api/upi-id`);
    console.log('UPI ID response:', upiIdResponse.data);
    
    // 14. Get referral link
    console.log('\n14. Testing referral link generation...');
    const referralLinkResponse = await axios.get(`${BASE_URL}/api/referral-link`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log('Referral link response:', referralLinkResponse.data);
    
    // 15. Health check
    console.log('\n15. Testing health check...');
    const healthResponse = await axios.get(`${BASE_URL}/api/health`);
    console.log('Health check response:', healthResponse.data);
    
    console.log('\nAll API tests completed successfully!');
  } catch (error) {
    console.error('API test error:', error.response?.data || error.message);
  }
}

testAPI();