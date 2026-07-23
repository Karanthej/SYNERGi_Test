// using native fetch
import { Client } from '@stomp/stompjs';
import WebSocket from 'ws';
Object.assign(global, { WebSocket });

async function runChatTest() {
  console.log("Starting Chat E2E Test...");
  const baseUrl = "http://localhost:1026/api/v1";
  
  const ts = Date.now();
  const fEmail = `founder_${ts}@example.com`;
  const tEmail = `talent_${ts}@example.com`;

  // 1. Founder Registration
  const fRegRes = await fetch(`${baseUrl}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fullName: "Test Founder", email: fEmail, password: "Password123!", role: "FOUNDER" })
  });
  const fReg = await fRegRes.json();
  const fOtp = fReg.data;

  // 2. Verify Founder
  const fVerifyRes = await fetch(`${baseUrl}/auth/register/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: fEmail, otpCode: fOtp })
  });
  const fVerify = await fVerifyRes.json();
  const fToken = fVerify.data.accessToken;

  // 3. Create Startup
  const startupRes = await fetch(`${baseUrl}/founder/startups`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${fToken}` },
    body: JSON.stringify({ name: `Test Startup ${ts}`, tagline: "Chat test", status: "PUBLISHED" })
  });
  const startup = await startupRes.json();
  const startupId = startup.data.uuid; 

  // 4. Talent Registration
  const tRegRes = await fetch(`${baseUrl}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fullName: "Test Talent", email: tEmail, password: "Password123!", role: "TALENT" })
  });
  const tReg = await tRegRes.json();
  const tOtp = tReg.data;

  // 5. Verify Talent
  const tVerifyRes = await fetch(`${baseUrl}/auth/register/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: tEmail, otpCode: tOtp })
  });
  const tVerify = await tVerifyRes.json();
  const tToken = tVerify.data.accessToken;

  // 7. Talent Applies
  const applyRes = await fetch(`${baseUrl}/talent/startups/${startupId}/apply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tToken}` },
    body: JSON.stringify({ introduction: "Hi", whyJoin: "Yes", whyRightFit: "Yes", preferredRole: "Dev", yearsExperience: "3", currentOccupation: "Dev", skills: "Java" })
  });
  const apply = await applyRes.json();
  console.log("Apply:", apply);
  const applicationId = apply.data ? apply.data.uuid : null;

  // 9. Founder Accepts
  const acceptRes = await fetch(`${baseUrl}/founder/applications/${applicationId}/status?status=ACCEPTED`, {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${fToken}` }
  });
  const accept = await acceptRes.json();
  console.log("Accept:", accept);
  
  // 10. Talent Checks Workspace
  const tWorkspaceRes = await fetch(`${baseUrl}/workspaces`, {
    headers: { 'Authorization': `Bearer ${tToken}` }
  });
  const tWorkspace = await tWorkspaceRes.json();
  console.log("tWorkspace response:", tWorkspace);
  const workspaceId = tWorkspace.data && tWorkspace.data.length > 0 ? tWorkspace.data[0].startupUuid : null;
  if (!workspaceId) {
    console.error("No workspace found!");
    process.exit(1);
  }
  
  console.log("Workspace created:", workspaceId);

  // Now let's test Chat API!
  // Founder gets rooms
  const fRoomsRes = await fetch(`${baseUrl}/workspaces/${workspaceId}/chat/rooms`, {
    headers: { 'Authorization': `Bearer ${fToken}` }
  });
  const fRooms = await fRoomsRes.json();
  console.log("Founder rooms:", fRooms.data);
  
  // Connect Founder WS
  const fWs = new Client({
    brokerURL: `ws://localhost:1026/ws-chat?token=${fToken}`,
    onConnect: () => { console.log("Founder connected to WS"); },
    onStompError: (frame) => { console.error("Founder WS Error", frame); }
  });
  fWs.activate();

  // Connect Talent WS
  const tWs = new Client({
    brokerURL: `ws://localhost:1026/ws-chat?token=${tToken}`,
    onConnect: () => { console.log("Talent connected to WS"); },
    onStompError: (frame) => { console.error("Talent WS Error", frame); }
  });
  tWs.activate();
  
  await new Promise(r => setTimeout(r, 2000));
  
  console.log("Chat test completed!");
  process.exit(0);
}

runChatTest().catch(console.error);
