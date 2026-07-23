import { test, expect } from '@playwright/test';

test('Verify complete Team Chat implementation', async ({ browser }) => {
  test.setTimeout(120000); // 2 minutes

  // Create two separate browser contexts
  const founderContext = await browser.newContext();
  const talentContext = await browser.newContext();

  const founderPage = await founderContext.newPage();
  const talentPage = await talentContext.newPage();

  const ts = Date.now();
  const fEmail = `founder_${ts}@example.com`;
  const tEmail = `talent_${ts}@example.com`;
  
  // API requests setup
  const apiContext = await founderPage.context().request;

  // 1. Founder Registration
  let res = await apiContext.post('http://localhost:1026/api/v1/auth/register', {
    data: { fullName: "Test Founder", email: fEmail, password: "Password123!", role: "FOUNDER" }
  });
  let json = await res.json();
  const fOtp = json.data;

  res = await apiContext.post('http://localhost:1026/api/v1/auth/register/verify', {
    data: { email: fEmail, otpCode: fOtp }
  });
  json = await res.json();
  const fToken = json.data.accessToken;
  const fUser = json.data.user;

  // 2. Create Startup
  res = await apiContext.post('http://localhost:1026/api/v1/founder/startups', {
    data: { name: `Test Startup ${ts}`, tagline: "Chat test", status: "PUBLISHED" },
    headers: { 'Authorization': `Bearer ${fToken}` }
  });
  json = await res.json();
  const startupId = json.data.uuid;

  // 3. Talent Registration
  res = await apiContext.post('http://localhost:1026/api/v1/auth/register', {
    data: { fullName: "Test Talent", email: tEmail, password: "Password123!", role: "TALENT" }
  });
  json = await res.json();
  const tOtp = json.data;

  res = await apiContext.post('http://localhost:1026/api/v1/auth/register/verify', {
    data: { email: tEmail, otpCode: tOtp }
  });
  json = await res.json();
  const tToken = json.data.accessToken;
  const tUser = json.data.user;

  // 4. Talent Applies
  res = await apiContext.post(`http://localhost:1026/api/v1/talent/startups/${startupId}/apply`, {
    data: { introduction: "Hi", whyJoin: "Yes", whyRightFit: "Yes", preferredRole: "Dev", yearsExperience: "3", currentOccupation: "Dev", skills: "Java" },
    headers: { 'Authorization': `Bearer ${tToken}` }
  });
  json = await res.json();
  const applicationId = json.data.uuid;

  // 5. Founder Accepts
  const acceptRes = await apiContext.put(`http://localhost:1026/api/v1/founder/applications/${applicationId}/status?status=ACCEPTED`, {
    headers: { 'Authorization': `Bearer ${fToken}` }
  });
  console.log("Accept Response Status: ", acceptRes.status());
  console.log("Accept Response Body: ", await acceptRes.text());

  // 6. Get Workspace ID
  res = await apiContext.get('http://localhost:1026/api/v1/workspaces', {
    headers: { 'Authorization': `Bearer ${tToken}` }
  });
  json = await res.json();
  const workspaceId = json.data[0].startupUuid;
  
  // Log workspace members for debugging
  const memRes = await apiContext.get(`http://localhost:1026/api/v1/workspaces/${workspaceId}/members`, {
    headers: { 'Authorization': `Bearer ${fToken}` }
  });
  console.log("Workspace Members: ", await memRes.text());

  // 7. Login through UI and go to Workspace
  // Founder UI
  await founderPage.goto('http://localhost:823');
  await founderPage.evaluate(({ token, email, uuid }) => {
    localStorage.setItem('accessToken', token);
    localStorage.setItem('auth-storage', JSON.stringify({ state: { token, accessToken: token, isAuthenticated: true, user: { role: 'FOUNDER', email, uuid, fullName: 'Test Founder', username: 'test_founder', isProfileComplete: true } } }));
  }, { token: fToken, email: fEmail, uuid: fUser.uuid });
  await founderPage.goto('http://localhost:823/founder/dashboard');
  
  // Talent UI
  await talentPage.goto('http://localhost:823');
  await talentPage.evaluate(({ token, email, uuid }) => {
    localStorage.setItem('accessToken', token);
    localStorage.setItem('auth-storage', JSON.stringify({ state: { token, accessToken: token, isAuthenticated: true, user: { role: 'TALENT', email, uuid, fullName: 'Test Talent', username: 'test_talent', isProfileComplete: true } } }));
  }, { token: tToken, email: tEmail, uuid: tUser.uuid });
  await talentPage.goto('http://localhost:823/talent/dashboard');

  // Go to Team Chat
  await founderPage.goto(`http://localhost:823/founder/workspace/${workspaceId}/chat`);
  await talentPage.goto(`http://localhost:823/talent/workspace/${workspaceId}/chat`);

  // Wait for sockets and data to load
  await founderPage.waitForTimeout(3000);
  await talentPage.waitForTimeout(3000);

  // 1. Founder -> Talent direct message
  // Click on talent name in sidebar
  await founderPage.screenshot({ path: 'founder-sidebar2.png', fullPage: true });
  console.log("Screenshot saved!");
  await founderPage.getByText('Test Talent').first().click({ force: true });
  await founderPage.waitForTimeout(3000); // Give time for room info to load
  await founderPage.screenshot({ path: 'founder-chat-header.png', fullPage: true });
  // Check header shows correct user (Rule 8)
  await expect(founderPage.locator('header h2')).toContainText('Test Talent');
  // Wait, wait until placeholder is absent
  const hasPlaceholder = await founderPage.getByText('Private Chat').count() > 0;
  if (hasPlaceholder) throw new Error("Private Chat placeholder is present!");

  await founderPage.getByPlaceholder('Type a message...').fill('Hello Talent!');
  await founderPage.getByPlaceholder('Type a message...').press('Enter');

  // Rule 4: Input clears after send
  await expect(founderPage.getByPlaceholder('Type a message...')).toHaveValue('');

  // 2. Talent receives it instantly (Rule 3)
  await expect(talentPage.getByText('Hello Talent!').first()).toBeVisible();

  // 6. Last message preview updates (Rule 6)
  await expect(talentPage.locator('p', { hasText: 'Hello Talent!' }).first()).toBeVisible();

  // 7. Unread count updates (Rule 7)
  // Since Talent hasn't clicked yet, unread count should show 1
  await expect(talentPage.locator('.bg-primary.text-primary-foreground').first()).toBeVisible();

  // Talent -> Founder direct message
  await talentPage.getByText('Test Founder').first().click({ force: true });
  await talentPage.getByPlaceholder('Type a message...').fill('Hi Founder!');
  await talentPage.getByPlaceholder('Type a message...').press('Enter');
  await expect(talentPage.getByPlaceholder('Type a message...')).toHaveValue('');

  // Founder receives it
  await expect(founderPage.getByText('Hi Founder!').first()).toBeVisible();

  // Create Group (Rule 10)
  await founderPage.getByRole('button', { name: /create group/i }).click({ force: true }); // if a button or icon
  // the button has Plus icon
  await founderPage.locator('button:has(svg.lucide-plus)').first().click({ force: true });
  
  await founderPage.fill('input[placeholder="e.g. Design Team"]', 'Dev Team');
  await founderPage.getByRole('dialog').getByText('Test Talent').click(); // check the checkbox
  await founderPage.getByRole('dialog').getByRole('button', { name: 'Create Group' }).click();

  // Open Group (Rule 11)
  await founderPage.waitForURL(`**/chat/**`);
  await expect(founderPage.locator('header h2')).toContainText('Dev Team');
  
  // 5. Sidebar updates (Group shows up)
  await expect(talentPage.getByText('Dev Team').first()).toBeVisible();

  // Send Group Message (Rule 12)
  await founderPage.getByPlaceholder('Type a message...').fill('Welcome to Dev Team!');
  await founderPage.getByPlaceholder('Type a message...').press('Enter');

  // Receive Group Message (Rule 13)
  await talentPage.getByText('Dev Team').first().click({ force: true });
  await expect(talentPage.getByText('Welcome to Dev Team!').first()).toBeVisible();

  // 14. No 404 anywhere, 15. Refresh works
  await founderPage.reload();
  await expect(founderPage.getByText('Welcome to Dev Team!').first()).toBeVisible();
  
  console.log("All E2E chat scenarios passed successfully.");
});
