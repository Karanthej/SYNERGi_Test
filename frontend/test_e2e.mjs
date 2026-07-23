async function runTest() {
  console.log("Starting SYNERGi E2E API Workflow Test...");
  const baseUrl = "http://localhost:8080/api/v1";
  
  const ts = Date.now();
  const fEmail = `founder_${ts}@example.com`;
  const tEmail = `talent_${ts}@example.com`;

  // 1. Founder Registration
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
  console.log("Founder Register:", fRegRes.status, fReg.message);
  
  const fOtp = fReg.data;

  // 2. Verify Founder OTP
  const fVerifyRes = await fetch(`${baseUrl}/auth/register/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: fEmail,
      otpCode: fOtp
    })
  });
  const fVerify = await fVerifyRes.json();
  console.log("Founder Verify:", fVerifyRes.status, fVerify.message);
  
  const fToken = fVerify.data.accessToken;

  // 3. Create Startup as Founder
  const startupRes = await fetch(`${baseUrl}/founder/startups`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${fToken}`
    },
    body: JSON.stringify({
      name: `Test Startup E2E ${ts}`,
      tagline: "E2E testing is fun",
      status: "PUBLISHED"
    })
  });
  const startup = await startupRes.json();
  console.log("Create Startup:", startupRes.status, startup.message);
  if (!startup.data) {
    console.error("Failed to create startup", startup);
    return;
  }
  const startupId = startup.data.uuid; 

  // 4. Talent Registration
  const tRegRes = await fetch(`${baseUrl}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: "Test Talent",
      email: tEmail,
      password: "Password123!",
      role: "TALENT"
    })
  });
  const tReg = await tRegRes.json();
  const tOtp = tReg.data;

  // 5. Verify Talent OTP
  const tVerifyRes = await fetch(`${baseUrl}/auth/register/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: tEmail,
      otpCode: tOtp
    })
  });
  const tVerify = await tVerifyRes.json();
  const tToken = tVerify.data.accessToken;
  console.log("Talent Verify:", tVerifyRes.status, tVerify.message);

  // 6. Talent Fetches Startups
  const getStartupsRes = await fetch(`${baseUrl}/talent/startups/explore`, {
    headers: { 'Authorization': `Bearer ${tToken}` }
  });
  const getStartups = await getStartupsRes.json();
  console.log("Talent sees startups count:", getStartups.data.content.length);

  // 7. Talent Applies to Startup
  const applyRes = await fetch(`${baseUrl}/talent/startups/${startupId}/apply`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tToken}`
    },
    body: JSON.stringify({
      shortIntroduction: "Hello!",
      whyJoin: "I love it",
      whyRightFit: "I am good",
      preferredRole: "Developer",
      yearsOfExperience: 3,
      currentOccupation: "Student"
    })
  });
  const apply = await applyRes.json();
  console.log("Talent Apply:", applyRes.status, apply.message);
  const applicationId = apply.data.uuid;

  // 8. Founder Reviews Applications
  const getAppsRes = await fetch(`${baseUrl}/founder/startups/${startupId}/applications`, {
    headers: { 'Authorization': `Bearer ${fToken}` }
  });
  const getApps = await getAppsRes.json();
  console.log("Founder sees applications:", getApps.data.content.length);

  // 9. Founder Accepts Talent
  const acceptRes = await fetch(`${baseUrl}/founder/applications/${applicationId}/status?status=ACCEPTED`, {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${fToken}` }
  });
  const accept = await acceptRes.json();
  console.log("Founder Accepts:", acceptRes.status, accept.message);

  // 10. Talent Checks Workspace
  const tWorkspaceRes = await fetch(`${baseUrl}/workspaces`, {
    headers: { 'Authorization': `Bearer ${tToken}` }
  });
  const tWorkspace = await tWorkspaceRes.json();
  console.log("Talent Workspaces Count:", tWorkspace.data?.length || 0);
  
  console.log("--- E2E TEST COMPLETED ---");
}

runTest();
