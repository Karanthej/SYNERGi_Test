async function runTest() {
  const baseUrl = "http://localhost:8080/api/v1";
  const ts = Date.now();
  const fEmail = `test_pending_${ts}@example.com`;

  console.log("Registering...", fEmail);
  const fRegRes = await fetch(`${baseUrl}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fullName: "Test Pending", email: fEmail, password: "Password123!", role: "FOUNDER" })
  });
  
  const text = await fRegRes.text();
  console.log("Register Response:", fRegRes.status, text);
  
  if(fRegRes.status === 200) {
      const data = JSON.parse(text);
      const otpCode = data.data; // Now this is our DB OTP code!
      console.log("Got OTP code", otpCode);
      
      const fVerifyRes = await fetch(`${baseUrl}/auth/register/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: fEmail, otpCode: otpCode })
      });
      console.log("Verify Response:", fVerifyRes.status, await fVerifyRes.text());
  }
}
runTest();
