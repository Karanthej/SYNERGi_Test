import { chromium } from 'playwright';

(async () => {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    const timestamp = Date.now();
    const testEmail = `test+${timestamp}@example.com`;

    console.log(`Testing registration with email: ${testEmail}`);

    await page.goto('http://localhost:5173/register');

    // Fill form
    await page.fill('input[name="fullName"]', 'Integration Test User');
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', 'Password123!');
    
    // Select role (assuming standard select or custom)
    await page.click('button:has-text("Startup Founder")'); // Try clicking a role button if it exists, or skip if not required

    // Submit form
    console.log("Submitting registration form...");
    await page.click('button[type="submit"]');

    // Wait for OTP page to load
    console.log("Waiting for OTP page...");
    await page.waitForURL('**/otp-verification');
    console.log("Reached OTP verification page.");

    // Fill OTP
    console.log("Filling OTP with test code 424242...");
    // The OTP input might be multiple inputs or a single hidden one.
    // The component has 6 inputs:
    const inputs = await page.$$('input[type="text"]');
    if (inputs.length === 6) {
        const code = "424242";
        for (let i = 0; i < 6; i++) {
            await inputs[i].fill(code[i]);
        }
    } else {
        console.log("Could not find 6 OTP inputs.");
    }

    // Submit OTP (it might auto-submit, but click just in case)
    await page.click('button[type="submit"]');

    console.log("Waiting for /auth/sync network request...");
    const response = await page.waitForResponse(res => res.url().includes('/auth/sync') && res.request().method() === 'POST');
    
    console.log(`Sync User API Response Status: ${response.status()}`);
    const responseBody = await response.json();
    console.log("Sync User API Response Body:", JSON.stringify(responseBody, null, 2));

    if (response.status() === 200 && responseBody.success) {
        console.log("SUCCESS: /api/v1/auth/sync returned 200 OK.");
        
        // Wait for redirect to onboarding or dashboard
        console.log("Waiting for redirect...");
        await page.waitForNavigation();
        console.log(`Redirected to: ${page.url()}`);
        
        if (page.url().includes('/onboarding') || page.url().includes('/dashboard')) {
            console.log("SUCCESS: Redirect to onboarding/dashboard succeeded.");
        } else {
            console.log("ERROR: Redirected to unexpected URL.");
        }
    } else {
        console.log("ERROR: Profile synchronization failed.");
    }

    await browser.close();
})();
