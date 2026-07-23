import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error' || msg.type() === 'warning') {
      errors.push(`[${msg.type()}] ${msg.text()}`);
    }
  });
  
  page.on('pageerror', error => {
    errors.push(`[pageerror] ${error.message}\n${error.stack}`);
  });

  try {
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
  } catch (e) {
    errors.push(`[goto error] ${e.message}`);
  }
  
  console.log("=== BROWSER ERRORS ===");
  errors.forEach(e => console.log(e));
  console.log("======================");
  
  await browser.close();
})();
