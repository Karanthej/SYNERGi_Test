async function runTest() {
  const baseUrl = "http://localhost:8080/api/v1";
  const ts = Date.now();
  const fEmail = `founder_${ts}@example.com`;
  
  const fRegRes = await fetch(`${baseUrl}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: "Test Founder",
      email: fEmail,
      password: "Password123!",
      role: "FOUNDER"
    })
  });
  const fReg = await fRegRes.json();
  console.log("Founder Register:", fRegRes.status, fReg);
}
runTest();
