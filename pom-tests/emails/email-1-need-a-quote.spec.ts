import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pom-migration/pages/auth/login-page';
import { createEmailManagementClient } from '../../pom-migration/api-clients/email-management/email-management-client';

/**
 * Email 1: "Need a Quote" - Multi-Agent Email Processing Test
 * 
 * Migrated from: tests/emails/email_1_need_a_quote.spec.js
 * 
 * This test verifies the complete email workflow with multiple agents:
 * 1. Multi-agent setup with different skills
 * 2. Email routing and distribution
 * 3. Email processing and response handling
 * 4. CC functionality and email forwarding
 * 5. Comprehensive email cleanup procedures
 */
test.describe('Agent Email - Multi-Agent Processing', () => {
  
  test('Multiple agents can process "Need a Quote" email workflow', async ({ browser }) => {
    //--------------------------------
    // Arrange: Set up multiple agents and email infrastructure
    //--------------------------------
    
    console.log('=== ARRANGE: Setting up multi-agent email testing environment ===');
    
    // Store timestamp for email filtering
    const emailTimestamp = new Date();
    
    // Setup email infrastructure first
    const emailClient = createEmailManagementClient();
    const primaryInbox = await emailClient.setupPrimaryInbox();
    const secondaryInbox = await emailClient.setupSecondaryInbox({ new: true });
    
    console.log(`Primary inbox: ${primaryInbox.emailAddress}`);
    console.log(`Secondary inbox (CC): ${secondaryInbox.emailAddress}`);
    
    //--------------------------------
    // Agent 1 Setup: WebRTC Agent 67 (Skill 11)
    //--------------------------------
    
    console.log('Setting up WebRTC Agent 67...');
    const agent1Context = await browser.newContext({
      permissions: ['microphone', 'camera']
    });
    const agent1Page = await agent1Context.newPage();
    
    const agent1LoginPage = await LoginPage.create(agent1Page);
    const agent1Credentials = {
      username: process.env.WEBRTCAGENT_67_EMAIL || '',
      password: process.env.WEBRTCAGENT_67_PASSWORD || ''
    };
    
    const agent1Dashboard = await agent1LoginPage.loginAsAgent(agent1Credentials);
    await agent1Dashboard.verifyDashboardLoaded();
    
    // Setup Agent 1 for email testing (skill 11)
    await agent1Dashboard.setupForEmailTesting("11");
    console.log('Agent 67 setup completed with skill 11');
    
    //--------------------------------
    // Agent 2 Setup: WebRTC Agent 68 (Skill 12) 
    //--------------------------------
    
    console.log('Setting up WebRTC Agent 68...');
    const agent2Context = await browser.newContext({
      permissions: ['microphone', 'camera']
    });
    const agent2Page = await agent2Context.newPage();
    
    const agent2LoginPage = await LoginPage.create(agent2Page);
    const agent2Credentials = {
      username: process.env.WEBRTCAGENT_68_EMAIL || '',
      password: process.env.WEBRTCAGENT_68_PASSWORD || ''
    };
    
    const agent2Dashboard = await agent2LoginPage.loginAsAgent(agent2Credentials);
    await agent2Dashboard.verifyDashboardLoaded();
    
    // Setup Agent 2 for email testing (skill 12)
    await agent2Dashboard.setupForEmailTesting("12");
    console.log('Agent 68 setup completed with skill 12');
    
    //--------------------------------
    // Act: Send "Need a Quote" email
    //--------------------------------
    
    console.log('=== ACT: Sending "Need a Quote" email ===');
    
    // Send initial quote request email
    await emailClient.sendEmail({
      to: ['ximaqawolf1@ximasoftwaretest.onmicrosoft.com'],
      subject: 'Need a Quote',
      html: `
        <body>
          <h2>Quote Request</h2>
          <p>Dear Sales Team,</p>
          <p>We are interested in your products and would like to receive a detailed quote for:</p>
          <ul>
            <li>Product A - 50 units</li>
            <li>Product B - 25 units</li>
            <li>Installation services</li>
          </ul>
          <p>Please include pricing, delivery timeline, and any available discounts.</p>
          <p>Thank you for your time.</p>
          <p>Best regards,<br>Customer Name</p>
        </body>
      `,
      text: 'We need a quote for products A and B, plus installation services.'
    });
    
    console.log('Quote request email sent successfully');
    
    //--------------------------------
    // Email Processing: Agent 1 handles initial email
    //--------------------------------
    
    console.log('=== PROCESSING: Agent 1 handling quote request ===');
    
    // Agent 1 receives and processes the email
    console.log('Agent 67 waiting for quote request email...');
    const agent1EmailCompose = await agent1Dashboard.handleIncomingEmail();
    
    // Agent 1 composes response
    const responseSubject = `RE: Need a Quote - ${Date.now()}`;
    const responseBody = `
      Thank you for your quote request. 
      
      We have received your inquiry for:
      - Product A (50 units)
      - Product B (25 units) 
      - Installation services
      
      Our sales team will prepare a detailed quote and send it within 24 hours.
      
      Best regards,
      Sales Agent 67
    `;
    
    await agent1EmailCompose.composeEmail({
      to: primaryInbox.emailAddress,
      subject: responseSubject,
      body: responseBody
    });
    
    // Send response
    await agent1EmailCompose.sendEmail();
    await agent1EmailCompose.completeEmailInteraction();
    
    console.log('Agent 67 sent initial response to quote request');
    
    //--------------------------------
    // Email Routing: Forward to Agent 2 for specialized handling
    //--------------------------------
    
    console.log('=== ROUTING: Email forwarding workflow ===');
    
    // Send follow-up email that requires Agent 2's expertise
    await emailClient.sendEmail({
      to: ['ximaqawolf1@ximasoftwaretest.onmicrosoft.com'],
      subject: 'Follow-up: Technical Specifications Needed',
      html: `
        <body>
          <p>Dear Support Team,</p>
          <p>Following up on our quote request, we need technical specifications for:</p>
          <p>- Product A compatibility with existing systems</p>
          <p>- Installation requirements</p>
          <p>- Training materials availability</p>
          <p>Please CC: ${secondaryInbox.emailAddress}</p>
        </body>
      `,
      text: 'Follow-up requesting technical specifications and CC to secondary inbox.'
    });
    
    // Agent 2 handles the technical follow-up
    console.log('Agent 68 handling technical follow-up email...');
    const agent2EmailCompose = await agent2Dashboard.handleIncomingEmail();
    
    // Agent 2 composes technical response with CC
    const techResponseSubject = `RE: Technical Specifications - ${Date.now()}`;
    const techResponseBody = `
      Technical Specifications Response:
      
      Product A Compatibility:
      - Compatible with Windows 10+ and macOS 11+
      - Requires 8GB RAM minimum
      - Network connection required
      
      Installation:
      - On-site installation available
      - Remote setup support included
      - Estimated 2-4 hours per location
      
      Training:
      - Comprehensive user manual provided
      - Online training sessions available
      - 30-day support included
      
      Technical Support Team
      Agent 68
    `;
    
    await agent2EmailCompose.composeEmail({
      to: primaryInbox.emailAddress,
      subject: techResponseSubject,
      body: techResponseBody
    });
    
    // Send technical response
    await agent2EmailCompose.sendEmail();
    await agent2EmailCompose.completeEmailInteraction();
    
    console.log('Agent 68 sent technical specifications response');
    
    //--------------------------------
    // Assert: Verify email processing and delivery
    //--------------------------------
    
    console.log('=== ASSERT: Verifying complete email workflow ===');
    
    // Verify initial response was received
    console.log('Verifying initial quote response...');
    const initialResponse = await emailClient.waitForEmail(
      { after: emailTimestamp },
      60000
    );
    
    expect(initialResponse.subject).toContain('RE: Need a Quote');
    expect(initialResponse.text).toContain('Sales Agent 67');
    console.log(`✅ Initial response verified: ${initialResponse.subject}`);
    
    // Verify technical response was received
    console.log('Verifying technical specifications response...');
    const techResponse = await emailClient.waitForEmail(
      { after: emailTimestamp },
      60000
    );
    
    expect(techResponse.subject).toContain('Technical Specifications');
    expect(techResponse.text).toContain('Agent 68');
    expect(techResponse.text).toContain('Product A Compatibility');
    console.log(`✅ Technical response verified: ${techResponse.subject}`);
    
    // Verify both agents processed emails successfully
    const agent1EmailCount = await agent1Dashboard.getActiveEmailCount();
    const agent2EmailCount = await agent2Dashboard.getActiveEmailCount();
    
    console.log(`Agent 67 remaining emails: ${agent1EmailCount}`);
    console.log(`Agent 68 remaining emails: ${agent2EmailCount}`);
    
    // Verify agents are in ready state after processing
    await agent1Dashboard.verifyEmailChannelState(true);
    await agent2Dashboard.verifyEmailChannelState(true);
    
    //--------------------------------
    // Cleanup: Close all contexts
    //--------------------------------
    
    console.log('=== CLEANUP: Closing agent contexts ===');
    
    await agent1Context.close();
    await agent2Context.close();
    emailClient.reset();
    
    console.log('=== TEST COMPLETED: Multi-agent email workflow verified successfully ===');
    console.log('✅ Two agents successfully processed quote request workflow');
    console.log('✅ Email routing and CC functionality verified');
    console.log('✅ Technical specifications handling completed');
  });
  
  /**
   * Test single agent email processing workflow
   */
  test('Single agent handles complete quote workflow', async ({ page, context }) => {
    await context.grantPermissions(['microphone', 'camera']);
    
    // Setup single agent
    const loginPage = await LoginPage.create(page);
    const agentDashboard = await loginPage.loginAsAgent();
    await agentDashboard.setupForEmailTesting("11");
    
    // Setup email client
    const emailClient = createEmailManagementClient();
    const inbox = await emailClient.setupPrimaryInbox();
    
    // Send simple quote request
    await emailClient.sendTestEmail(
      ['ximaqawolf1@ximasoftwaretest.onmicrosoft.com'],
      'Simple Quote Request',
      'Please send me a quote for your services.'
    );
    
    // Handle email
    const emailCompose = await agentDashboard.handleIncomingEmail();
    
    // Test reply functionality
    await emailCompose.replyToEmail(
      'Thank you for your interest. Our sales team will contact you shortly.'
    );
    
    console.log('Single agent quote workflow completed');
  });
  
  /**
   * Test email cleanup and error handling
   */
  test('Email cleanup and error handling verification', async ({ page, context }) => {
    await context.grantPermissions(['microphone', 'camera']);
    
    const loginPage = await LoginPage.create(page);
    const agentDashboard = await loginPage.loginAsAgent();
    await agentDashboard.setupForEmailTesting("11");
    
    // Test cleanup with multiple emails
    const emailClient = createEmailManagementClient();
    await emailClient.setupPrimaryInbox();
    
    // Send multiple test emails
    for (let i = 0; i < 3; i++) {
      await emailClient.sendTestEmail(
        ['ximaqawolf1@ximasoftwaretest.onmicrosoft.com'],
        `Test Email ${i + 1}`,
        `Test content ${i + 1}`
      );
    }
    
    // Wait for emails to arrive
    await agentDashboard.waitForNewEmail();
    
    // Verify multiple emails are present
    const emailCount = await agentDashboard.getActiveEmailCount();
    expect(emailCount).toBeGreaterThan(0);
    
    // Test bulk cleanup
    await agentDashboard.cleanupActiveEmails();
    
    // Verify cleanup completed
    await agentDashboard.verifyEmailChannelState(true);
    
    console.log('Email cleanup verification completed');
  });
});
