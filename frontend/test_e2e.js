const axios = require("axios");

const api = axios.create({
  baseURL: "http://localhost:8080/api/v1",
  validateStatus: () => true
});

async function runTest() {
  console.log("Starting SYNERGi E2E API Workflow Test...");
  
  // 1. Founder Registration
  const fReg = await api.post("/auth/register", {
    fullName: "Test Founder",
    email: "founder_test@example.com",
    password: "Password123!",
    role: "FOUNDER"
  });
  console.log("Founder Register:", fReg.status, fReg.data.message);
  
  // Because it generates OTP, we need to bypass or read the OTP from the DB.
  // Since we can't easily read the DB from Node without a pg driver, let's just 
  // check if the endpoint returns 200 OK.
  
  // Actually, I can use the OTP we got in the response payload earlier?
  // No, I updated the code so the OTP isn't in the payload, but EmailJS doesn't return it either.
  // Wait, I DID NOT change AuthController to hide the OTP!
  // I only updated .env for EmailJS. Let's look at fReg.data to see if OTP is there.
  console.log("OTP Data:", fReg.data);
  
}
runTest();
