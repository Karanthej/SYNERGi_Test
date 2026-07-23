import { chromium } from 'playwright';

(async () => {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
    page.on('response', response => {
        if (!response.ok()) {
            console.log(`NETWORK FAILURE: ${response.url()} ${response.status()}`);
            response.text().then(text => console.log(`RESPONSE BODY: ${text}`)).catch(() => {});
        }
    });

    console.log('Navigating to http://localhost:5173/auth...');
    await page.goto('http://localhost:5173/auth');
    
    // Switch to Sign Up tab if there is one, or click Sign Up button
    console.log('Waiting for Sign Up to be visible...');
    // We don't know the exact DOM, let's just click 'Sign up' text
    await page.getByText('Sign up', { exact: true }).click().catch(() => page.getByText('Sign Up').click());
    
    console.log('Filling in details...');
    // We assume standard Clerk SignUp component
    await page.getByLabel('Email address').fill('test_trace_123@example.com').catch(() => {});
    await page.getByLabel('Password', { exact: true }).fill('Password123!').catch(() => {});
    await page.getByRole('button', { name: 'Continue' }).click().catch(() => {});

    await page.waitForTimeout(5000);
    
    await browser.close();
})();
