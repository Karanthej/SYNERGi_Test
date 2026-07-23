async function runTest() {
  const baseUrl = "http://localhost:8080/api/v1";
  const ts = Date.now();
  const fEmail = `founder_${ts}@example.com`;
  
  // Register founder & get token...
  const fRegRes = await fetch(`${baseUrl}/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fullName: "Test Founder", email: fEmail, password: "Password123!", role: "FOUNDER" }) });
  const fOtp = (await fRegRes.json()).data;
  const fVerifyRes = await fetch(`${baseUrl}/auth/register/verify`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: fEmail, otpCode: fOtp }) });
  const fToken = (await fVerifyRes.json()).data.accessToken;

  const tWorkspaceRes = await fetch(`${baseUrl}/workspaces`, { headers: { 'Authorization': `Bearer ${fToken}` } });
  const tWorkspace = await tWorkspaceRes.json();
  console.log("Workspaces retrieved");
}
runTest();
