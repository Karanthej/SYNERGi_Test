import { chromium } from 'playwright';

(async () => {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    console.log('Navigating to http://localhost:5173/register...');
    await page.goto('http://localhost:5173/register');
    
    try {
        console.log('Waiting for Register form to load...');
        await page.waitForSelector('input#fullName', { timeout: 15000 });
        
        console.log('Filling form...');
        await page.fill('input#fullName', 'Real Trace Test');
        
        // Use a Clerk test email to bypass real email verification. Clerk dev instances accept 424242 for test+*@example.com
        const testEmail = 'test+' + Date.now() + '@example.com';
        await page.fill('input#reg-email', testEmail);
        console.log('Using email:', testEmail);
        
        // Select Role (Radix UI)
        await page.click('button[role="combobox"]');
        await page.waitForTimeout(500);
        await page.click('div[role="option"]:has-text("Startup Founder")');
        
        await page.fill('input#reg-password', 'Password123!@#');
        await page.fill('input#confirmPassword', 'Password123!@#');
        
        // Accept Terms
        await page.click('button[role="checkbox"]');
        
        console.log('Submitting form...');
        await page.click('button[type="submit"]');
        
        console.log('Waiting for OTP page...');
        await page.waitForURL('**/otp-verification', { timeout: 15000 });
        console.log('Successfully reached OTP verification page.');
        
        console.log('Entering test OTP (424242)...');
        // The OTP page uses InputOTP from shadcn, which creates multiple inputs
        // Usually we can just type into the first input or the container
        await page.waitForSelector('input[type="text"]', { timeout: 10000 });
        
        // Since InputOTP creates multiple hidden or separate inputs, we can try keyboard typing
        await page.click('input[type="text"]');
        await page.keyboard.type('424242', { delay: 50 });
        
        console.log('Clicking Verify button...');
        await page.click('button:has-text("Verify Email")');
        
        console.log('Waiting for redirect after successful verification...');
        await page.waitForURL('**/onboarding*', { timeout: 15000 });
        console.log('Successfully reached Onboarding / Dashboard!');
        
        console.log('Current URL:', page.url());
        
        console.log('SIGNUP END-TO-END SUCCESSFUL');
    } catch (e) {
        console.log('Error interacting with page:', e.message);
        await page.screenshot({ path: 'signup_error.png' });
        console.log('Screenshot saved to signup_error.png');
    }

    await browser.close();
})();
