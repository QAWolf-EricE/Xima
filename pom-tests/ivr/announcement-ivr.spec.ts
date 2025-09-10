import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pom-migration/pages/auth/login-page';
import { createTwilioIvrClient, IVR_CONFIGS } from '../../pom-migration/api-clients/twilio-ivr/twilio-ivr-client';

/**
 * Announcement IVR Test
 * 
 * Migrated from: tests/ivr/announcement_ivr.spec.js
 * 
 * This test verifies the announcement IVR functionality:
 * 1. Audio announcement playback through IVR system
 * 2. Call flow with announcement verification
 * 3. Supervisor reporting for announcement operations
 * 4. Mountain timezone announcement processing
 */
test.describe('IVR Testing - Announcement Flow', () => {
  
  test('Announcement IVR plays announcements correctly', async ({ browser }) => {
    console.log('=== ARRANGE: Setting up Announcement IVR test infrastructure ===');
    
    const twilioIvrClient = createTwilioIvrClient();
    const uniqueIdentifier = twilioIvrClient.generateUniqueIdentifier();
    
    console.log(`Announcement IVR test starting with identifier: ${uniqueIdentifier}`);
    
    const supervisorContext = await browser.newContext();
    const supervisorPage = await supervisorContext.newPage();
    const supervisorLoginPage = await LoginPage.create(supervisorPage);
    const supervisorDashboard = await supervisorLoginPage.loginAsSupervisor();
    
    console.log('=== ACT: Executing Announcement IVR call flow ===');
    
    const ivrTestResult = await twilioIvrClient.executeIvrTest({
      testName: IVR_CONFIGS.ANNOUNCEMENT.testName,
      baseUrl: IVR_CONFIGS.ANNOUNCEMENT.baseUrl,
      params: {},
      callDuration: 20,
      checkResults: true
    });
    
    console.log('=== ASSERT: Verifying Announcement IVR results ===');
    
    expect(ivrTestResult.success).toBe(true);
    expect(ivrTestResult.callStatus.status).toBe('completed');
    console.log('✅ Announcement IVR call completed successfully');
    
    const reportsDashboard = await supervisorDashboard.navigateToReports();
    const callStartTime = ivrTestResult.callStatus.startTime || ivrTestResult.startTime;
    await reportsDashboard.verifyIvrCallInReports(uniqueIdentifier, callStartTime);
    
    twilioIvrClient.cleanup();
    await supervisorContext.close();
    
    console.log('=== TEST COMPLETED: Announcement IVR flow verified ===');
  });
});
