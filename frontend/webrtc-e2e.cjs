const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: true, args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', '--mute-audio'] });
    const karanAuth = { state: { isAuthenticated: true, user: { uuid: '43137a23-3ef7-467c-906c-cbce83d12177', fullName: 'Karan', email: 'karanthejkk@gmail.com', role: 'FOUNDER' }, accessToken: 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJrYXJhbnRoZWpra0BnbWFpbC5jb20iLCJpYXQiOjE3ODQ0NzcxODQsImV4cCI6MTc4NDU2MzU4NH0.dwC2sL41B5nYUoXqXKwafwrHIBEkQMbgLNzvqB1_fmk' }, version: 0 };
    const adithyaAuth = { state: { isAuthenticated: true, user: { uuid: '2254fbdd-a953-413d-935c-c84d704aed36', fullName: 'Adithya', email: 'adithya70755@gmail.com', role: 'FOUNDER' }, accessToken: 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhZGl0aHlhNzA3NTVAZ21haWwuY29tIiwiaWF0IjoxNzg0NDc3MTg0LCJleHAiOjE3ODQ1NjM1ODR9.6SEfGj4kFO3Ks0uqzSMocb421eE9HeAPyQJMuTHf78c' }, version: 0 };
    const p1 = await browser.newPage();
    const p2 = await browser.newPage();
    let p1Logs = [], p2Logs = [];
    p1.on('console', m => p1Logs.push(m.text()));
    p2.on('console', m => p2Logs.push(m.text()));

    await p1.goto('http://localhost:823');
    await p1.evaluate((a) => localStorage.setItem('auth-storage', JSON.stringify(a)), karanAuth);
    await p2.goto('http://localhost:823');
    await p2.evaluate((a) => localStorage.setItem('auth-storage', JSON.stringify(a)), adithyaAuth);

    const workspaceId = await p1.evaluate(async (token) => {
        const res = await fetch('http://localhost:1026/api/v1/startups', { headers: { Authorization: 'Bearer ' + token } });
        const data = await res.json();
        return data[0]?.uuid;
    }, karanAuth.state.accessToken);

    if (workspaceId) {
        const roomId = await p1.evaluate(async ({token, wid}) => {
             const res = await fetch('http://localhost:1026/api/v1/chat/rooms/workspace/' + wid, { headers: { Authorization: 'Bearer ' + token } });
             const data = await res.json();
             return data.find(r => r.type === 'PRIVATE')?.uuid || data[0]?.uuid;
        }, {token: karanAuth.state.accessToken, wid: workspaceId});
        
        await p1.goto(`http://localhost:823/founder/workspace/${workspaceId}/chat/${roomId}`);
        await p1.waitForLoadState('networkidle');
        await p2.goto(`http://localhost:823/founder/workspace/${workspaceId}/chat/${roomId}`);
        await p2.waitForLoadState('networkidle');
        
        await p1.waitForTimeout(3000);
        await p1.evaluate(() => {
             const btns = Array.from(document.querySelectorAll('button'));
             const callBtn = btns.find(b => b.innerHTML.includes('lucide-phone'));
             if(callBtn) callBtn.click();
        });
        
        await p2.waitForTimeout(3000);
        await p2.evaluate(() => {
             const btns = Array.from(document.querySelectorAll('button'));
             const ansBtn = btns.find(b => b.innerHTML.includes('Answer') || b.innerHTML.includes('Accept'));
             if(ansBtn) ansBtn.click();
        });
        
        await p1.waitForTimeout(10000);
    }
    console.log('--- KARAN LOGS ---');
    console.log(p1Logs.join('\n'));
    console.log('--- ADITHYA LOGS ---');
    console.log(p2Logs.join('\n'));
    await browser.close();
})();
