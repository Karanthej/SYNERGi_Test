import { test, expect, chromium, BrowserContext, Page } from '@playwright/test';

// Utility to create isolated contexts for Caller and Receiver
async function createVoiceContexts() {
  const browser = await chromium.launch({
    args: [
      '--use-fake-ui-for-media-stream',
      '--use-fake-device-for-media-stream'
    ]
  });

  const callerContext = await browser.newContext({ permissions: ['microphone', 'notifications'] });
  const receiverContext = await browser.newContext({ permissions: ['microphone', 'notifications'] });

  const caller = await callerContext.newPage();
  const receiver = await receiverContext.newPage();

  return { browser, callerContext, receiverContext, caller, receiver };
}

test.describe('SYNERGi Voice Calling E2E Suite', () => {

  test('1. Connection - Normal Call Flow (Accept & End)', async () => {
    const { browser, caller, receiver } = await createVoiceContexts();
    
    // Simulate navigation to the app (Assume authenticated via clerk tokens)
    await caller.goto('/chat');
    await receiver.goto('/chat');

    // Caller initiates call
    await caller.click('[data-testid="start-call-button"]');
    
    // Receiver sees incoming call overlay
    await expect(receiver.locator('text=Incoming Call')).toBeVisible({ timeout: 10000 });
    
    // Receiver accepts call
    await receiver.click('button:has-text("Accept")');
    
    // Verify both are connected
    await expect(caller.locator('text=Connected')).toBeVisible();
    await expect(receiver.locator('text=Connected')).toBeVisible();

    // Verify cleanup
    await caller.click('button:has-text("End Call")');
    await expect(caller.locator('text=Connected')).toBeHidden();
    await expect(receiver.locator('text=Connected')).toBeHidden();
    
    await browser.close();
  });

  test('2. Connection - ICE Restart on Network Drop', async () => {
    const { browser, callerContext, caller, receiver } = await createVoiceContexts();
    
    await caller.goto('/chat');
    await receiver.goto('/chat');
    await caller.click('[data-testid="start-call-button"]');
    await receiver.click('button:has-text("Accept")');

    // Simulate Caller Network Disconnect using CDP
    const session = await callerContext.newCDPSession(caller);
    await session.send('Network.emulateNetworkConditions', {
      offline: true,
      latency: 0,
      downloadThroughput: 0,
      uploadThroughput: 0
    });

    // Verify UI reflects "Poor Connection" or "Reconnecting"
    await expect(caller.locator('text=Poor Connection')).toBeVisible({ timeout: 15000 });

    // Restore network
    await session.send('Network.emulateNetworkConditions', {
      offline: false,
      latency: 20,
      downloadThroughput: 5000000,
      uploadThroughput: 5000000
    });

    // Verify ICE Restart recovers call
    await expect(caller.locator('text=Connected')).toBeVisible({ timeout: 15000 });
    
    await browser.close();
  });

  test('3. Call Flow - Hold & Accept Call Waiting', async () => {
    const { browser, callerContext, receiverContext } = await createVoiceContexts();
    const caller1 = await callerContext.newPage();
    const caller2 = await callerContext.newPage();
    const receiver = await receiverContext.newPage();
    
    await caller1.goto('/chat');
    await receiver.goto('/chat');
    await caller2.goto('/chat');

    // Caller 1 calls Receiver
    await caller1.click('[data-testid="start-call-button"]');
    await receiver.click('button:has-text("Accept")');

    // Caller 2 calls Receiver (triggers Call Waiting)
    await caller2.click('[data-testid="start-call-button"]');
    
    // Receiver clicks Hold & Accept
    await receiver.click('button:has-text("Hold & Accept")');
    
    // Verify Receiver is talking to Caller 2
    await expect(caller1.locator('text=On Hold')).toBeVisible();
    await expect(caller2.locator('text=Connected')).toBeVisible();

    // Receiver ends call with Caller 2
    await receiver.click('button:has-text("End Call")');

    // Verify automatic resumption with Caller 1
    await expect(caller1.locator('text=Connected')).toBeVisible();

    await browser.close();
  });

  test('4. Browser - Refresh During Call Recovery', async () => {
    const { browser, caller, receiver } = await createVoiceContexts();
    
    await caller.goto('/chat');
    await receiver.goto('/chat');
    await caller.click('[data-testid="start-call-button"]');
    await receiver.click('button:has-text("Accept")');

    // Force reload on caller tab
    await caller.reload();

    // Verify connection automatically restored
    await expect(caller.locator('text=Connected')).toBeVisible({ timeout: 15000 });
    
    await browser.close();
  });

  test('5. Media - Hardware Muting', async () => {
    const { browser, caller, receiver } = await createVoiceContexts();
    
    await caller.goto('/chat');
    await receiver.goto('/chat');
    await caller.click('[data-testid="start-call-button"]');
    await receiver.click('button:has-text("Accept")');

    // Caller mutes
    await caller.click('button:has-text("Mute")');
    
    // Verify UI
    await expect(receiver.locator('[data-testid="remote-muted-icon"]')).toBeVisible();
    
    await browser.close();
  });
});
