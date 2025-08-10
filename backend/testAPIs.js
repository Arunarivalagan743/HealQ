require('dotenv').config();
const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Test data from our database check
const doctorUserId = '6894c9b5dabd5449cff1b09d';  // Dr. Ramji
const patientUserId = '6894a79d05621c2fafe8f745'; // Ariv

// Mock JWT tokens (we'll need real ones for actual testing)
const testAppointmentAPIs = async () => {
  try {
    console.log('Testing appointment APIs...\n');
    
    // Test 1: Check if endpoints exist
    console.log('=== Testing API Endpoints ===');
    
    try {
      const healthCheck = await axios.get(`${BASE_URL.replace('/api', '')}/health`);
      console.log('✅ Health check passed:', healthCheck.status);
    } catch (error) {
      console.log('❌ Health check failed:', error.message);
    }
    
    // Test 2: Try appointment endpoints without auth (should get 401)
    console.log('\n=== Testing Without Auth (should get 401) ===');
    
    try {
      const doctorResponse = await axios.get(`${BASE_URL}/appointments/doctor`);
      console.log('❌ Doctor endpoint should require auth but returned:', doctorResponse.status);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Doctor endpoint properly requires authentication');
      } else {
        console.log('❌ Doctor endpoint error:', error.message);
      }
    }
    
    try {
      const patientResponse = await axios.get(`${BASE_URL}/appointments/patient`);
      console.log('❌ Patient endpoint should require auth but returned:', patientResponse.status);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Patient endpoint properly requires authentication');
      } else {
        console.log('❌ Patient endpoint error:', error.message);
      }
    }
    
    console.log('\n=== Next Steps ===');
    console.log('1. The APIs exist and require authentication (good!)');
    console.log('2. We need to check if the mobile app is sending valid auth tokens');
    console.log('3. Check the backend logs when mobile app makes requests');
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
};

testAppointmentAPIs();
