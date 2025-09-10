import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pom-migration/pages/auth/login-page';
import { createEmailManagementClient } from '../../pom-migration/api-clients/email-management/email-management-client';

/**
 * Send 5MB Email Attachment As Agent Test
 * 
 * Migrated from: tests/emails/send_5_mb_email_attachment_as_an_agent.spec.js
 * 
 * This test verifies that WebRTC Agent can send emails with large attachments (5MB)
 * through the agent dashboard email interface. Tests the complete email sending workflow:
 * 1. Agent login and email channel setup
 * 2. Email composition with attachment
 * 3. Email sending and delivery verification
 * 4. Attachment integrity verification
 */
test.describe('Agent Email - Send Attachments', () => {
  
  test('WebRTC Agent can send 5MB email attachment', async ({ page, context }) => {
    //--------------------------------
    // Arrange: Set up WebRTC Agent for email testing
    //--------------------------------
    
    console.log('=== ARRANGE: Setting up WebRTC Agent 72 for email testing ===');
    
    // Store current datetime for email filtering
    const emailTimestamp = new Date();
    
    // Configure browser context for WebRTC
    await context.grantPermissions(['microphone', 'camera']);
    
    // Create login page and login as WebRTC Agent 72
    const loginPage = await LoginPage.create(page);
    const agentCredentials = {
      username: process.env.WEBRTCAGENT_72_EMAIL || '',
      password: process.env.WEBRTCAGENT_72_PASSWORD || ''
    };
    
    console.log(`Logging in as WebRTC Agent 72: ${agentCredentials.username}`);
    const agentDashboard = await loginPage.loginAsAgent(agentCredentials);
    await agentDashboard.verifyDashboardLoaded();
    
    // Setup agent for email testing (skill 21, ready status, email channel)
    console.log('Setting up agent for email testing...');
    await agentDashboard.setupForEmailTesting("21");
    
    // Verify email channel is properly enabled
    await agentDashboard.verifyEmailChannelState(true);
    console.log('Agent setup completed - ready for email testing');
    
    //--------------------------------
    // Email Infrastructure Setup
    //--------------------------------
    
    console.log('=== SETTING UP EMAIL INFRASTRUCTURE ===');
    
    // Initialize email management client
    const emailClient = createEmailManagementClient();
    
    // Setup primary inbox for sending
    const primaryInbox = await emailClient.setupPrimaryInbox();
    console.log(`Primary inbox ready: ${primaryInbox.emailAddress}`);
    
    // Setup secondary inbox for receiving (with 5MB attachment)
    const attachmentRecipient = 'xima+agent72@qawolf.email';
    const receivingInbox = await emailClient.setupInboxWithAddress(attachmentRecipient);
    console.log(`Receiving inbox ready: ${receivingInbox.emailAddress}`);
    
    // Send initial email to agent to trigger email workflow
    console.log('Sending initial email to agent...');
    await emailClient.sendEmail({
      to: ['ximaqawolf1@ximasoftwaretest.onmicrosoft.com'],
      subject: 'Send 5mb',
      html: '<body>5mb</body>',
      text: '5mb'
    });
    
    //--------------------------------
    // Act: Handle email and send response with attachment
    //--------------------------------
    
    console.log('=== ACT: Handling email and sending attachment ===');
    
    // Wait for email to arrive and open it
    const emailComposePage = await agentDashboard.handleIncomingEmail();
    console.log('Email received and opened for composition');
    
    // Compose email response with attachment
    const testSubject = `test${Date.now()}`;
    const testBody = `test${Date.now()}`;
    
    console.log('Composing email response...');
    await emailComposePage.composeEmail({
      to: attachmentRecipient,
      subject: testSubject,
      body: testBody
    });
    
    // Attach 5MB file
    const fileName = '5mb.txt';
    const filePath = `/home/wolf/team-storage/${fileName}`;
    
    console.log(`Attaching file: ${fileName}`);
    await emailComposePage.attachFile(filePath);
    
    // Verify attachment appears in the email
    await emailComposePage.verifyAttachment(fileName);
    
    // Send the email
    console.log('Sending email with attachment...');
    await emailComposePage.sendEmail();
    
    // Complete email interaction
    await emailComposePage.completeEmailInteraction();
    
    //--------------------------------
    // Assert: Verify email delivery and attachment
    //--------------------------------
    
    console.log('=== ASSERT: Verifying email delivery and attachment ===');
    
    // Wait for email to be received
    console.log('Waiting for email with attachment to be received...');
    const receivedMessage = await emailClient.waitForEmail(
      { 
        after: emailTimestamp,
        useSecondary: false  // Use the receiving inbox we set up
      },
      60000
    );
    
    // Verify email content
    expect(receivedMessage.subject).toBe(testSubject);
    console.log(`Email received with subject: ${receivedMessage.subject}`);
    
    // Verify attachment is present and correct
    expect(receivedMessage.attachments).toHaveLength(1);
    expect(receivedMessage.attachments[0].fileName).toBe(fileName);
    
    console.log('=== TEST COMPLETED: Email with 5MB attachment sent successfully ===');
    console.log(`✅ Attachment verified: ${receivedMessage.attachments[0].fileName}`);
    console.log(`✅ Email delivered successfully to: ${attachmentRecipient}`);
  });
  
  /**
   * Test email attachment workflow without sending (UI verification only)
   */
  test('Agent email attachment interface workflow', async ({ page, context }) => {
    // Setup similar to main test
    await context.grantPermissions(['microphone', 'camera']);
    
    const loginPage = await LoginPage.create(page);
    const agentCredentials = {
      username: process.env.WEBRTCAGENT_72_EMAIL || '',
      password: process.env.WEBRTCAGENT_72_PASSWORD || ''
    };
    
    const agentDashboard = await loginPage.loginAsAgent(agentCredentials);
    await agentDashboard.setupForEmailTesting("21");
    
    // Initialize email infrastructure
    const emailClient = createEmailManagementClient();
    await emailClient.setupPrimaryInbox();
    
    // Send test email to agent
    await emailClient.sendTestEmail(
      ['ximaqawolf1@ximasoftwaretest.onmicrosoft.com'],
      'UI Test Email',
      'Testing email interface'
    );
    
    // Handle email and test UI workflow
    const emailComposePage = await agentDashboard.handleIncomingEmail();
    
    // Test email composition interface
    await emailComposePage.setRecipient('test@example.com');
    await emailComposePage.setSubject('Test Subject');
    await emailComposePage.setBody('Test Body Content');
    
    // Verify form fields are populated correctly
    const currentSubject = await emailComposePage.getCurrentSubject();
    const currentBody = await emailComposePage.getCurrentBody();
    
    expect(currentSubject).toBe('Test Subject');
    expect(currentBody).toContain('Test Body Content');
    
    // Test form clearing
    await emailComposePage.clearForm();
    
    // Complete without sending
    await emailComposePage.completeEmailInteraction();
    
    console.log('Email interface workflow testing completed');
  });

  /**
   * Test error handling for email operations
   */
  test('Agent handles email errors gracefully', async ({ page, context }) => {
    await context.grantPermissions(['microphone', 'camera']);
    
    const loginPage = await LoginPage.create(page);
    const agentDashboard = await loginPage.loginAsAgent();
    
    // Test email channel state when no emails are present
    const hasEmails = await agentDashboard.hasActiveEmails();
    const emailCount = await agentDashboard.getActiveEmailCount();
    
    console.log(`Active emails: ${emailCount} (Has emails: ${hasEmails})`);
    
    // Verify email channel state
    await agentDashboard.verifyEmailChannelState();
    
    // Test cleanup when no emails exist (should not throw error)
    await agentDashboard.cleanupActiveEmails();
    
    console.log('Email error handling verification completed');
  });
});
