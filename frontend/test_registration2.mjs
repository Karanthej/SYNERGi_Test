import { chromium } from 'playwright';

(async () => {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
    page.on('response', async response => {
        if (!response.ok()) {
            console.log(`NETWORK FAILURE: ${response.url()} ${response.status()}`);
            try {
                const text = await response.text();
                console.log(`RESPONSE BODY: ${text}`);
            } catch (e) {}
        }
    });

    console.log('Navigating to auth page...');
    await page.goto('http://localhost:5173/auth');
    
    console.log('Waiting for network idle...');
    await page.waitForLoadState('networkidle');
    
    console.log('DOM snapshot:', await page.content());

    await browser.close();
})();
