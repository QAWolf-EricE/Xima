import { test, expect } from '@playwright/test';
import { WebRTCClient } from '../../pom-migration/api-clients/webrtc-management/webrtc-client';
import { WebRTCDialpadPage } from '../../pom-migration/pages/agent/webrtc-dialpad-page';

/**
 * WebRTC Outbound Dial an Incorrect Number Test
 * Migrated from: tests/web_rtc_outbound_call_flow/web_rtc_outbound_dial_an_incorrect_number.spec.js
 * 
 * This test covers:
 * - Login as WebRTC Agent 66
 * - Enable all skills for agent
 * - Set agent status to Ready
 * - Attempt to dial incorrect/invalid phone number
 * - Verify error message for invalid number
 * - Handle call end and error dialog cleanup
 */
test.describe('WebRTC Outbound Dial an Incorrect Number', () => {

  test('web_rtc_outbound_dial_an_incorrect_number', async ({ page }) => {
    // ================================================================================================
    // Step 1. WebRTC Dial an incorrect number
    // ================================================================================================
    
    // REQ03 Login as WebRTC Agent 66
    const agent66Credentials = {
      username: process.env.WEBRTCAGENT_66_EMAIL || '',
      password: process.env.DEFAULT_PASSWORD || ''
    };

    const webRTCClient = new WebRTCClient(page);

    // Login WebRTC Agent 66
    const agent66LoginPage = await webRTCClient.page.goto(process.env.DEFAULT_URL || '');
    await page.fill('[data-cy="consolidated-login-username-input"]', agent66Credentials.username);
    await page.fill('[data-cy="consolidated-login-password-input"]', agent66Credentials.password);
    await page.click('[data-cy="consolidated-login-login-button"]');

    // Toggle agent 66 skills on
    await page.click('[data-mat-icon-name="sliders"]');
    await page.click('span:text-is("All Skills On")');
    await page.click('[data-mat-icon-name="x"]');

    // Click exit if applicable
    try {
      await page.click('button:has-text("Exit")');
    } catch (err) {
      console.log(err);
    }

    // Toggle agent 66 status on
    const toggleStatusOn = require('../../lib/node_20_helpers').toggleStatusOn;
    await toggleStatusOn(page);

    // REQ212 WebRTC Dial incorrect number
    const dialpadPage = new WebRTCDialpadPage(page);
    
    await page.click('[data-cy="active-media-menu-button"]');
    await page.click('[data-mat-icon-name="active-media-voice"]'); // New call
    await page.waitForTimeout(500);
    
    if (await page.locator('button :text("Confirm")').count()) {
      await page.click(':text("Confirm")');
    }
    
    // Use invalid phone number
    const invalidPhone = "191-555-0788";
    await page.fill('[data-cy="dialpad-text"] #phoneNumberInput', invalidPhone);
    await page.click('[data-cy="call-button"]');

    // Assert error message
    await expect(page.locator(':text("There was an issue making outbound call. Please verify the dialed number is correct")')).toBeVisible();

    // End the call in case it doesn't end in 10s automatically
    try {
      await page.getByRole('button', { name: 'Close' }).click();
    } catch { 
      console.log("No group to associate popup.");
    }

    // End call
    try {
      await page.locator('[data-cy="end-call-btn"]').click({ timeout: 5000 });
    } catch (err) {
      console.log(err);
    }

    await expect(page.locator('xima-call:has-text("Call Ended")')).toBeVisible();

    console.log('✅ WebRTC outbound dial an incorrect number workflow completed successfully');
  });
});
