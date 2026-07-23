async function runTest() {
  const baseUrl = "http://localhost:8080/api/v1";
  const ts = Date.now();
  const fEmail = `founder_${ts}@example.com`;
  const tEmail = `talent_${ts}@example.com`;

  const fRegRes = await fetch(`${baseUrl}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fullName: "Test Founder", email: fEmail, password: "Password123!", role: "FOUNDER" })
  });
  const fReg = await fRegRes.json();
  const fOtp = fReg.data;

  const fVerifyRes = await fetch(`${baseUrl}/auth/register/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: fEmail, otpCode: fOtp })
  });
  const fVerify = await fVerifyRes.json();
  const fToken = fVerify.data.accessToken;

  const startupRes = await fetch(`${baseUrl}/founder/startups`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${fToken}` },
    body: JSON.stringify({ name: `Test Startup ${ts}`, tagline: "Tagline", status: "PUBLISHED" })
  });
  const startup = await startupRes.json();
  const startupId = startup.data.uuid;

  const tRegRes = await fetch(`${baseUrl}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fullName: "Test Talent", email: tEmail, password: "Password123!", role: "TALENT" })
  });
  const tReg = await tRegRes.json();
  const tOtp = tReg.data;

  const tVerifyRes = await fetch(`${baseUrl}/auth/register/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: tEmail, otpCode: tOtp })
  });
  const tVerify = await tVerifyRes.json();
  const tToken = tVerify.data.accessToken;

  const applyRes = await fetch(`${baseUrl}/talent/startups/${startupId}/apply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tToken}` },
    body: JSON.stringify({
      introduction: "Hello!",
      whyJoin: "I love it",
      whyRightFit: "I am good",
      preferredRole: "Developer",
      skills: "React, Java",
      yearsExperience: "3",
      currentOccupation: "Student"
    })
  });
  const apply = await applyRes.json();
  console.log("Talent Apply:", applyRes.status, apply.message, apply.data ? "Success" : apply);

  if (!apply.data) return;
  const applicationId = apply.data.uuid;

  const getAppsRes = await fetch(`${baseUrl}/founder/startups/${startupId}/applications`, {
    headers: { 'Authorization': `Bearer ${fToken}` }
  });
  const getApps = await getAppsRes.json();
  console.log("Founder sees applications:", getApps.data.content.length);

  const acceptRes = await fetch(`${baseUrl}/founder/applications/${applicationId}/status?status=ACCEPTED`, {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${fToken}` }
  });
  const accept = await acceptRes.json();
  console.log("Founder Accepts:", acceptRes.status, accept.message);

  const tWorkspaceRes = await fetch(`${baseUrl}/workspaces`, {
    headers: { 'Authorization': `Bearer ${tToken}` }
  });
  const tWorkspace = await tWorkspaceRes.json();
  console.log("Talent Workspaces Count:", tWorkspace.data?.length || 0);
  
  if (tWorkspace.data && tWorkspace.data.length > 0) {
      console.log("SUCCESS! E2E Complete");
  } else {
      console.log("Workspace check failed", tWorkspace);
  }
}
runTest();
