import { chromium } from 'playwright';

(async () => {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    let capturedResponse = null;
    let responseBody = null;

    page.on('response', async (response) => {
        const url = response.url();
        if (url.includes('v1/client/sign_ups')) {
            capturedResponse = response;
            try {
                responseBody = await response.text();
            } catch (e) {}
        }
    });

    console.log('Navigating to http://localhost:5173/register...');
    await page.goto('http://localhost:5173/register');
    
    try {
        console.log('Waiting for Clerk to initialize...');
        await page.waitForFunction(() => window.Clerk && window.Clerk.isReady, { timeout: 15000 });
        
        console.log('Executing signUp.create() directly via window.Clerk...');
        await page.evaluate(async () => {
            try {
                await window.Clerk.client.signUp.create({
                    emailAddress: 'test_trace_' + Date.now() + '@example.com',
                    password: 'Password123!@#',
                    firstName: 'Trace',
                    lastName: 'Test'
                });
            } catch (e) {
                console.error('Clerk SDK Error:', e);
            }
        });
        
        console.log('Waiting for network requests to settle...');
        await page.waitForTimeout(3000);
    } catch (e) {
        console.log('Error interacting with page:', e.message);
    }
    
    if (capturedResponse) {
        const req = capturedResponse.request();
        console.log('--- SIGN UP REQUEST CAPTURED ---');
        console.log('1. Request URL:', req.url());
        console.log('2. Request Method:', req.method());
        console.log('3. HTTP Status Code:', capturedResponse.status());
        console.log('4. Response Headers:', JSON.stringify(capturedResponse.headers(), null, 2));
        console.log('5. Response Body:', responseBody);
        
        let parsedBody = {};
        try { parsedBody = JSON.parse(responseBody); } catch(e) {}
        
        console.log('6. Clerk error code:', parsedBody.errors && parsedBody.errors.length > 0 ? parsedBody.errors[0].code : 'N/A');
        console.log('7. Clerk error message:', parsedBody.errors && parsedBody.errors.length > 0 ? parsedBody.errors[0].message : 'N/A');
        console.log('8. Clerk trace/request ID:', capturedResponse.headers()['x-clerk-trace-id'] || (parsedBody.meta ? parsedBody.meta.traceId : 'N/A') || 'N/A');
        
        const headers = await req.allHeaders();
        console.log('9. Origin header:', headers['origin'] || 'None');
        console.log('10. Referer header:', headers['referer'] || 'None');
        console.log('11. Host header:', headers['host'] || 'None');
        
        const cookies = headers['cookie'] ? headers['cookie'].split(';').map(c => c.split('=')[0].trim()).join(', ') : 'None';
        console.log('12. Cookie headers:', cookies);
        console.log('13. Reached Clerk successfully:', capturedResponse.status() < 500 ? 'Yes' : 'No');
    } else {
        console.log('No sign-up request captured.');
    }

    await browser.close();
})();
