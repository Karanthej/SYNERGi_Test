import { test, expect } from '@playwright/test';

test('Test file upload', async ({ page }) => {
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));

  await page.goto('http://localhost:823/login');
  await page.fill('input[type="email"]', 'founder_1784234615882@example.com');
  await page.fill('input[type="password"]', 'Password123!');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');
  
  // Find a workspace link or navigate
  await page.goto('http://localhost:823/app/82ef3bc1-766a-4d43-a6cd-77e8cd8b8ebc/chat'); // assuming workspace id
  
  // Wait for rooms to load, click the first room
  await page.waitForSelector('text=Dev Team');
  await page.click('text=Dev Team');
  
  // Wait for Message Composer
  await page.waitForSelector('textarea');
  
  // Attach a file
  const fileChooserPromise = page.waitForEvent('filechooser');
  await page.click('button[title="Attach File"]');
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles({
    name: 'test.png',
    mimeType: 'image/png',
    buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64')
  });
  
  // Wait for the preview
  await page.waitForSelector('img[alt="test.png"]');
  
  // Click send
  await page.click('button:has(.lucide-send)');
  
  // Wait a bit to see what happens
  await page.waitForTimeout(2000);
});
