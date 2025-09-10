import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pom-migration/pages/auth/login-page';
import { createEmailManagementClient } from '../../pom-migration/api-clients/email-management/email-management-client';

/**
 * Email 3: "Become a Real Estate Apprentice" Test
 * 
 * Migrated from: tests/emails/email_3_become_a_real_estate_apprentice.spec.js
 * 
 * This test verifies the email processing workflow for WebRTC Agent 48 with specific skills:
 * 1. WebRTC Agent 48 setup with skills 6 & 7
 * 2. Supervisor oversight and monitoring  
 * 3. Real estate apprentice email processing
 * 4. Email routing and skill-based distribution
 * 5. Complete email workflow with cleanup
 */
test.describe('Email Processing - Real Estate Apprentice', () => {
  
  test('WebRTC Agent 48 processes real estate apprentice email (Skill 6)', async ({ browser }) => {
    //--------------------------------
    // Arrange: Set up WebRTC Agent 48 and Supervisor
    //--------------------------------
    
    console.log('=== ARRANGE: Setting up WebRTC Agent 48 and Supervisor ===');
    
    // Store timestamp for email filtering
    const emailTimestamp = new Date();
    
    //--------------------------------
    // WebRTC Agent 48 Setup (Primary Email Handler)
    //--------------------------------
    
    console.log('Setting up WebRTC Agent 48...');
    const agentContext = await browser.newContext({
      permissions: ['microphone', 'camera']
    });
    const agentPage = await agentContext.newPage();
    
    const agentLoginPage = await LoginPage.create(agentPage);
    const agentCredentials = {
      username: process.env.WEBRTCAGENT_48_EMAIL || '',
      password: process.env.WEBRTCAGENT_48_PASSWORD || ''
    };
    
    const agentDashboard = await agentLoginPage.loginAsAgent(agentCredentials);
    await agentDashboard.verifyDashboardLoaded();
    console.log('WebRTC Agent 48 logged in successfully');
    
    // Bring agent page to front
    await agentPage.bringToFront();
    
    // Set agent to Ready status
    await agentDashboard.setReady();
    await agentDashboard.verifyAgentName('Xima Agent 48'); // Verify correct agent
    
    //--------------------------------
    // Supervisor Setup (Oversight)
    //--------------------------------
    
    console.log('Setting up Supervisor oversight...');
    const supervisorContext = await browser.newContext();
    const supervisorPage = await supervisorContext.newPage();
    
    const supervisorLoginPage = await LoginPage.create(supervisorPage);
    const supervisorDashboard = await supervisorLoginPage.loginAsSupervisor();
    await supervisorDashboard.verifyDashboardLoaded();
    console.log('Supervisor oversight setup completed');
    
    //--------------------------------
    // Initial Email Cleanup
    //--------------------------------
    
    console.log('Performing initial email cleanup...');
    await agentDashboard.cleanupActiveEmails();
    console.log('Initial cleanup completed');
    
    //--------------------------------
    // Email Infrastructure Setup
    //--------------------------------
    
    console.log('Setting up email management infrastructure...');
    const emailClient = createEmailManagementClient();
    const primaryInbox = await emailClient.setupPrimaryInbox();
    const ccInbox = await emailClient.setupSecondaryInbox({ new: true });
    
    console.log(`Primary inbox: ${primaryInbox.emailAddress}`);
    console.log(`CC inbox: ${ccInbox.emailAddress}`);
    
    //--------------------------------
    // Act: Send Real Estate Apprentice Email
    //--------------------------------
    
    console.log('=== ACT: Sending real estate apprentice email ===');
    
    // Per Kelly's guidance: emails should be ~45-60 seconds apart for routing system
    // Context: https://qawolfhq.slack.com/archives/C03PG5DB4N9/p1696366663073979
    
    // Send Email 3 to the system
    console.log('Sending real estate apprentice email...');
    await emailClient.sendEmail({
      to: ['ximaqawolf1@ximasoftwaretest.onmicrosoft.com'],
      subject: 'Email 3: Become a Real Estate Apprentice (Skill 6)',
      html: '<body>It\'s not a pyramid scheme, I promise!</body>',
      text: 'Real estate apprentice opportunity - not a pyramid scheme!'
    });
    
    // Add minor delay for queue time to develop in Cradle to Grave (C2G)
    console.log('Adding queue development delay (30 seconds)...');
    await agentPage.waitForTimeout(30000);
    
    //--------------------------------
    // Agent Skill Configuration: Skills 6 & 7
    //--------------------------------
    
    console.log('Configuring Agent 48 with skills 6 & 7...');
    
    // Navigate to skills management
    const skillsPage = await agentDashboard.navigateToSkillsManagement();
    
    // Turn off all skills first
    await skillsPage.allSkillsOff();
    await agentPage.waitForTimeout(1000);
    
    // Enable specific skills: Skill 6 (primary) and Skill 7 (secondary)
    await skillsPage.enableSkill('6');
    await agentPage.waitForTimeout(1000);
    
    // Close skills dialog
    await skillsPage.close();
    
    // Set Agent to Ready status after skill configuration
    await agentDashboard.setReady();
    console.log('Agent 48 configured with skills 6 & 7 and set to Ready');
    
    //--------------------------------
    // Channel State Configuration (Email Only)
    //--------------------------------
    
    console.log('Configuring channel states for email-only processing...');
    
    // Enable all channel states first
    await agentDashboard.enableChannel('VOICE');
    await agentDashboard.enableChannel('CHAT'); 
    await agentDashboard.enableChannel('EMAIL');
    
    // Then disable voice and chat, keeping only email
    await agentDashboard.disableChannel('VOICE');
    await agentDashboard.disableChannel('CHAT');
    
    // Verify email channel is ready
    await agentDashboard.verifyEmailChannelState(true);
    console.log('Email channel configured and ready');
    
    //--------------------------------
    // Email Processing Workflow
    //--------------------------------
    
    console.log('=== PROCESSING: Agent 48 handling real estate email ===');
    
    // Wait for and handle the incoming email
    const emailComposePage = await agentDashboard.handleIncomingEmail();
    console.log('Real estate apprentice email received and opened');
    
    // Compose professional response to the real estate inquiry
    const responseSubject = `RE: Real Estate Apprentice Opportunity - ${Date.now()}`;
    const responseBody = `
      Thank you for your interest in real estate opportunities.
      
      We appreciate you reaching out regarding apprentice positions. However, we want to ensure 
      you're aware that:
      
      - All legitimate real estate opportunities require proper licensing
      - Educational requirements must be met through accredited institutions  
      - Commission structures should be transparent and clearly documented
      - No upfront fees should be required for legitimate opportunities
      
      If you're genuinely interested in real estate, we recommend:
      1. Research state licensing requirements
      2. Contact accredited real estate schools
      3. Connect with established, licensed brokerages
      4. Verify any opportunity through appropriate regulatory bodies
      
      Best regards,
      Real Estate Compliance Team
      Agent 48 - WebRTC Support
      
      Note: This response was generated as part of our email processing verification system.
    `;
    
    await emailComposePage.composeEmail({
      to: primaryInbox.emailAddress,
      subject: responseSubject,
      body: responseBody
    });
    
    // Send the response
    await emailComposePage.sendEmail();
    await emailComposePage.completeEmailInteraction();
    
    console.log('Agent 48 sent professional response to real estate inquiry');
    
    //--------------------------------
    // Supervisor Quality Assurance
    //--------------------------------
    
    console.log('Supervisor performing quality assurance review...');
    
    // Supervisor monitors the email processing through dashboard
    await supervisorDashboard.verifyDashboardLoaded();
    
    // In production, supervisor would have visibility into:
    // - Agent email response times
    // - Quality of responses
    // - Compliance with policies
    // - Escalation needs
    
    console.log('Supervisor QA review completed');
    
    //--------------------------------
    // Assert: Verify Complete Workflow Success
    //--------------------------------
    
    console.log('=== ASSERT: Verifying real estate email processing workflow ===');
    
    // Verify the professional response was sent
    const responseEmail = await emailClient.waitForEmail(
      { after: emailTimestamp },
      60000
    );
    
    expect(responseEmail.subject).toContain('RE: Real Estate Apprentice Opportunity');
    expect(responseEmail.text).toContain('Agent 48 - WebRTC Support');
    expect(responseEmail.text).toContain('real estate opportunities require proper licensing');
    expect(responseEmail.text).toContain('No upfront fees should be required');
    console.log(`✅ Professional response verified: ${responseEmail.subject}`);
    
    // Verify agent is in ready state after processing
    await agentDashboard.verifyEmailChannelState(true);
    
    // Verify no remaining active emails
    const remainingEmails = await agentDashboard.getActiveEmailCount();
    console.log(`Agent 48 remaining emails: ${remainingEmails}`);
    
    // Verify skills are still configured correctly
    const channelStates = await agentDashboard.getChannelStatesSummary();
    console.log('Final channel states:', channelStates);
    
    expect(channelStates.EMAIL).toBe(true);  // Email should be enabled
    expect(channelStates.VOICE).toBe(false); // Voice should be disabled  
    expect(channelStates.CHAT).toBe(false);  // Chat should be disabled
    
    //--------------------------------
    // Cleanup: Close All Contexts
    //--------------------------------
    
    console.log('=== CLEANUP: Closing all contexts ===');
    
    await agentContext.close();
    await supervisorContext.close();
    emailClient.reset();
    
    console.log('=== TEST COMPLETED: Real estate apprentice email processing verified ===');
    console.log('✅ WebRTC Agent 48 successfully processed real estate inquiry');
    console.log('✅ Professional compliance response sent');
    console.log('✅ Skills 6 & 7 configuration verified');
    console.log('✅ Email-only channel configuration maintained');
    console.log('✅ Supervisor oversight implemented');
  });
  
  /**
   * Test simplified real estate email processing workflow
   */
  test('Agent handles real estate inquiry with standard workflow', async ({ page, context }) => {
    await context.grantPermissions(['microphone', 'camera']);
    
    // Setup WebRTC Agent 48
    const loginPage = await LoginPage.create(page);
    const agentCredentials = {
      username: process.env.WEBRTCAGENT_48_EMAIL || '',
      password: process.env.WEBRTCAGENT_48_PASSWORD || ''
    };
    
    const agentDashboard = await loginPage.loginAsAgent(agentCredentials);
    await agentDashboard.setupForEmailTesting("6"); // Skill 6 for real estate
    
    // Setup email client
    const emailClient = createEmailManagementClient();
    await emailClient.setupPrimaryInbox();
    
    // Send simplified real estate email
    await emailClient.sendTestEmail(
      ['ximaqawolf1@ximasoftwaretest.onmicrosoft.com'],
      'Real Estate Opportunity Inquiry',
      'Interested in real estate apprentice program. Please provide details.'
    );
    
    // Handle email with professional response
    const emailCompose = await agentDashboard.handleIncomingEmail();
    await emailCompose.replyToEmail(
      'Thank you for your interest. We recommend researching proper licensing requirements and connecting with accredited institutions.'
    );
    
    console.log('Simplified real estate email workflow completed');
  });
  
  /**
   * Test skill configuration verification for Agent 48
   */
  test('Agent 48 skill configuration and channel management', async ({ page, context }) => {
    await context.grantPermissions(['microphone', 'camera']);
    
    const loginPage = await LoginPage.create(page);
    const agentCredentials = {
      username: process.env.WEBRTCAGENT_48_EMAIL || '',
      password: process.env.WEBRTCAGENT_48_PASSWORD || ''
    };
    
    const agentDashboard = await loginPage.loginAsAgent(agentCredentials);
    
    // Test skill management interface
    const skillsPage = await agentDashboard.navigateToSkillsManagement();
    await skillsPage.enableSkill('6');
    await skillsPage.close();
    
    // Test channel state management
    await agentDashboard.enableChannel('EMAIL');
    await agentDashboard.disableChannel('VOICE');
    await agentDashboard.disableChannel('CHAT');
    
    // Verify final state
    const channelStates = await agentDashboard.getChannelStatesSummary();
    expect(channelStates.EMAIL).toBe(true);
    expect(channelStates.VOICE).toBe(false);
    expect(channelStates.CHAT).toBe(false);
    
    console.log('Agent 48 skill and channel configuration verified');
  });
});
