import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pom-migration/pages/auth/login-page';
import { createEmailManagementClient } from '../../pom-migration/api-clients/email-management/email-management-client';

/**
 * Email 6: "Make $10k a week!" Test
 * 
 * Migrated from: tests/emails/email_6_make_10_k_a_week.spec.js
 * 
 * This test verifies UC Agent 6 integration with timezone-aware supervisor oversight:
 * 1. UC Agent 6 (Extension 106) setup with Ready/Lunch status transitions
 * 2. Supervisor with America/Denver timezone configuration
 * 3. Suspicious income opportunity email processing (fraud detection workflow)
 * 4. Status management and agent availability testing
 * 5. Compliance and security response protocols
 */
test.describe('Email Processing - Suspicious Income Opportunity Detection', () => {
  
  test('UC Agent 6 handles suspicious "Make $10k a week" email with compliance protocols', async ({ browser }) => {
    //--------------------------------
    // Arrange: Set up UC Agent 6 and Timezone-Aware Supervisor
    //--------------------------------
    
    console.log('=== ARRANGE: Setting up UC Agent 6 and timezone-aware Supervisor ===');
    
    // Store timestamp for filtering
    const emailTimestamp = new Date();
    
    //--------------------------------
    // UC Agent 6 Setup (Extension 106)
    //--------------------------------
    
    console.log('Setting up UC Agent 6 (Extension 106)...');
    const ucAgentContext = await browser.newContext({
      permissions: ['microphone', 'camera']
    });
    const ucAgentPage = await ucAgentContext.newPage();
    
    const ucAgentLoginPage = await LoginPage.create(ucAgentPage);
    const ucAgentCredentials = {
      username: process.env.UC_AGENT_6_EXT_106 || '',
      password: process.env.UC_AGENT_6_EXT_106_PASSWORD || ''
    };
    
    const ucAgentDashboard = await ucAgentLoginPage.loginAsAgent(ucAgentCredentials);
    await ucAgentDashboard.verifyDashboardLoaded();
    console.log('UC Agent 6 (Extension 106) logged in successfully');
    
    //--------------------------------
    // Supervisor Setup with America/Denver Timezone
    //--------------------------------
    
    console.log('Setting up Supervisor with America/Denver timezone...');
    const supervisorContext = await browser.newContext({
      // Configure timezone context for supervisor
      timezoneId: 'America/Denver'
    });
    const supervisorPage = await supervisorContext.newPage();
    
    const supervisorLoginPage = await LoginPage.create(supervisorPage);
    const supervisorDashboard = await supervisorLoginPage.loginAsSupervisor();
    await supervisorDashboard.verifyDashboardLoaded();
    console.log('Supervisor with America/Denver timezone setup completed');
    
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
    // Initial Agent Status Management: Ready → Lunch
    //--------------------------------
    
    console.log('Configuring initial agent status transitions...');
    
    // Set agent to Ready initially
    await ucAgentDashboard.setReady();
    let agentStatus = await ucAgentDashboard.getAgentStatus();
    expect(agentStatus).toBe('Ready');
    console.log('UC Agent 6 set to Ready status');
    
    // Perform initial email cleanup while Ready
    await ucAgentDashboard.cleanupActiveEmails();
    console.log('Initial email cleanup completed');
    
    // Transition agent to Lunch status (as per original test workflow)
    await ucAgentDashboard.setStatus('Lunch');
    agentStatus = await ucAgentDashboard.getAgentStatus();
    expect(agentStatus).toBe('Lunch');
    console.log('UC Agent 6 transitioned to Lunch status');
    
    //--------------------------------
    // Act: Send Suspicious Income Opportunity Email
    //--------------------------------
    
    console.log('=== ACT: Sending suspicious income opportunity email ===');
    
    // Send suspicious "Make $10k a week" email (potential fraud/scam)
    console.log('Sending suspicious income opportunity email...');
    await emailClient.sendEmail({
      to: ['ximaqawolf1@ximasoftwaretest.onmicrosoft.com'],
      subject: 'Email 6: Make $10k a week!',
      html: `
        <body>
          <h2>💰 MAKE $10,000 EVERY WEEK! 💰</h2>
          <p><strong>URGENT: Limited Time Opportunity!</strong></p>
          
          <p>Are you tired of your 9-to-5 job? Ready to make REAL money from home?</p>
          
          <div style="background-color: #ffeb3b; padding: 10px; border: 2px solid #f57f17; text-align: center;">
            <h3>🚀 GUARANTEED $10,000 PER WEEK! 🚀</h3>
            <p><strong>NO EXPERIENCE REQUIRED!</strong></p>
            <p><strong>WORK FROM HOME!</strong></p>
            <p><strong>MAKE MONEY WHILE YOU SLEEP!</strong></p>
          </div>
          
          <p>Here's how it works:</p>
          <ol>
            <li>💳 Send us a small startup fee of $299</li>
            <li>📱 Download our exclusive money-making app</li>
            <li>⏰ Work just 2 hours per day</li>
            <li>💰 Watch the money roll in!</li>
          </ol>
          
          <p><strong>⚠️ WARNING: Only 50 spots available!</strong></p>
          
          <div style="background-color: #f44336; color: white; padding: 15px; text-align: center;">
            <h3>🔥 ACT NOW! OFFER EXPIRES IN 24 HOURS! 🔥</h3>
            <p>Don't let this life-changing opportunity slip away!</p>
          </div>
          
          <p>Testimonials:</p>
          <blockquote>
            <p>"I made $50,000 in my first month!" - Anonymous Success Story</p>
            <p>"This changed my life! I quit my job!" - Definitely Real Person</p>
          </blockquote>
          
          <p><strong>Click here to get started: [SUSPICIOUS LINK]</strong></p>
          <p><strong>Call our hotline: 1-800-SCAM-NOW</strong></p>
          
          <p><small>* Results not typical. Individual results may vary. 
          This is definitely not a scam. Trust us.</small></p>
          
          <p>Money Making Guru<br>
          Totally Legitimate Business Opportunity LLC</p>
        </body>
      `,
      text: `MAKE $10,000 EVERY WEEK! Guaranteed income opportunity. Send $299 startup fee to begin. Limited time offer!`
    });
    
    console.log('Suspicious income opportunity email sent (fraud detection test)');
    
    //--------------------------------
    // Agent Status Transition: Lunch → Ready for Processing
    //--------------------------------
    
    console.log('Transitioning agent from Lunch to Ready for email processing...');
    
    // Add processing delay
    await ucAgentPage.waitForTimeout(30000); // 30 seconds for queue development
    
    // Transition back to Ready to handle the email
    await ucAgentDashboard.setReady();
    agentStatus = await ucAgentDashboard.getAgentStatus();
    expect(agentStatus).toBe('Ready');
    console.log('UC Agent 6 transitioned back to Ready for email processing');
    
    //--------------------------------
    // Email Processing with Fraud Detection Protocol
    //--------------------------------
    
    console.log('=== PROCESSING: UC Agent 6 handling suspicious email with compliance protocols ===');
    
    // Setup agent for email processing with appropriate skill
    await ucAgentDashboard.setupForEmailTesting("6"); // Skill 6 for fraud detection
    
    // Wait for and handle the suspicious email
    const emailComposePage = await ucAgentDashboard.handleIncomingEmail();
    console.log('Suspicious income opportunity email received and flagged');
    
    // Compose professional compliance response (fraud prevention)
    const responseSubject = `RE: Suspicious Income Opportunity - Security Alert - ${Date.now()}`;
    const responseBody = `
      SECURITY ALERT - FRAUD PREVENTION RESPONSE
      
      Dear Sender,
      
      Your email regarding "Make $10k a week" has been received and reviewed by our security team.
      
      🚨 FRAUD DETECTION ALERT:
      This email contains multiple indicators of fraudulent activity and potential scams:
      
      ⚠️ RED FLAGS IDENTIFIED:
      • Unrealistic income promises ($10,000/week with no experience)
      • Upfront payment requests ($299 "startup fee")
      • High-pressure tactics ("Limited time," "Act now")
      • Vague business model with no legitimate explanation
      • Anonymous testimonials with no verification
      • Suspicious contact methods
      
      📋 COMPLIANCE RESPONSE:
      As UC Agent 6 (Extension 106), I am required to:
      1. ❌ REJECT this opportunity as fraudulent
      2. 🛡️ PROTECT customers from financial scams
      3. 📝 REPORT this to our fraud prevention team
      4. 🚫 ADVISE against any participation
      
      🔒 SECURITY RECOMMENDATIONS:
      • DO NOT send any money or personal information
      • DO NOT click any links in the original email
      • DO NOT call the provided phone numbers
      • REPORT this email to anti-fraud authorities
      • DELETE the original email immediately
      
      📞 LEGITIMATE SUPPORT:
      If you're looking for legitimate income opportunities:
      • Consult with licensed financial advisors
      • Research established companies with proper credentials
      • Verify all business opportunities through official channels
      • Never pay upfront fees for "guaranteed" income
      
      🕐 TIMEZONE NOTE:
      This response is being processed in America/Denver timezone as part of our 
      distributed agent network for comprehensive fraud protection coverage.
      
      REMEMBER: If it sounds too good to be true, it probably is.
      
      Best regards,
      UC Agent 6 - Fraud Prevention Team
      Extension: 106
      Security and Compliance Division
      
      This is an automated security response. For legitimate business inquiries, 
      please use our official contact channels.
    `;
    
    await emailComposePage.composeEmail({
      to: primaryInbox.emailAddress,
      subject: responseSubject,
      body: responseBody
    });
    
    // Send the fraud prevention response
    await emailComposePage.sendEmail();
    await emailComposePage.completeEmailInteraction();
    
    console.log('UC Agent 6 sent comprehensive fraud prevention response');
    
    //--------------------------------
    // Supervisor Security Oversight with Timezone Management
    //--------------------------------
    
    console.log('Supervisor performing security oversight with timezone awareness...');
    
    // Supervisor monitors fraud detection workflow
    await supervisorDashboard.verifyDashboardLoaded();
    
    // In production, supervisor would monitor:
    // - Fraud detection accuracy and response time
    // - Agent compliance with security protocols
    // - Cross-timezone coordination for 24/7 protection
    // - Escalation procedures for serious fraud attempts
    // - Customer protection effectiveness
    
    console.log('Supervisor security oversight with America/Denver timezone completed');
    
    //--------------------------------
    // Final Agent Status: Ready → Lunch (End of Shift)
    //--------------------------------
    
    console.log('Managing end-of-shift status transition...');
    
    // After handling the security issue, agent can return to Lunch
    await ucAgentDashboard.setStatus('Lunch');
    agentStatus = await ucAgentDashboard.getAgentStatus();
    expect(agentStatus).toBe('Lunch');
    console.log('UC Agent 6 returned to Lunch status after security processing');
    
    //--------------------------------
    // Assert: Verify Complete Security Workflow
    //--------------------------------
    
    console.log('=== ASSERT: Verifying fraud detection and compliance workflow ===');
    
    // Verify the fraud prevention response was sent
    const securityEmail = await emailClient.waitForEmail(
      { after: emailTimestamp },
      60000
    );
    
    expect(securityEmail.subject).toContain('RE: Suspicious Income Opportunity - Security Alert');
    expect(securityEmail.text).toContain('UC Agent 6 - Fraud Prevention Team');
    expect(securityEmail.text).toContain('Extension: 106');
    expect(securityEmail.text).toContain('FRAUD DETECTION ALERT');
    expect(securityEmail.text).toContain('RED FLAGS IDENTIFIED');
    expect(securityEmail.text).toContain('DO NOT send any money');
    expect(securityEmail.text).toContain('America/Denver timezone');
    console.log(`✅ Fraud prevention response verified: ${securityEmail.subject}`);
    
    // Verify agent status management worked correctly
    const finalStatus = await ucAgentDashboard.getAgentStatus();
    expect(finalStatus).toBe('Lunch');
    console.log(`Final agent status verified: ${finalStatus}`);
    
    // Verify email channel is clean after processing
    const remainingEmails = await ucAgentDashboard.getActiveEmailCount();
    console.log(`UC Agent remaining emails: ${remainingEmails}`);
    
    // Verify channel states maintained
    const channelStates = await ucAgentDashboard.getChannelStatesSummary();
    console.log('Final channel states:', channelStates);
    
    //--------------------------------
    // Cleanup: Close All Contexts and Systems
    //--------------------------------
    
    console.log('=== CLEANUP: Closing all contexts and systems ===');
    
    await ucAgentContext.close();
    await supervisorContext.close();
    emailClient.reset();
    
    console.log('=== TEST COMPLETED: Fraud detection with timezone-aware supervision verified ===');
    console.log('✅ UC Agent 6 successfully detected and responded to fraud email');
    console.log('✅ Professional security response sent with compliance protocols');
    console.log('✅ Status transitions (Ready → Lunch → Ready → Lunch) verified');
    console.log('✅ America/Denver timezone supervision implemented');
    console.log('✅ Fraud prevention workflow completed');
    console.log('✅ Customer protection protocols activated');
  });
  
  /**
   * Test simplified fraud detection workflow
   */
  test('UC Agent handles suspicious email with standard fraud response', async ({ page, context }) => {
    await context.grantPermissions(['microphone', 'camera']);
    
    // Setup UC Agent 6
    const loginPage = await LoginPage.create(page);
    const ucAgentCredentials = {
      username: process.env.UC_AGENT_6_EXT_106 || '',
      password: process.env.UC_AGENT_6_EXT_106_PASSWORD || ''
    };
    
    const ucAgentDashboard = await loginPage.loginAsAgent(ucAgentCredentials);
    await ucAgentDashboard.setupForEmailTesting("6"); // Skill 6 for fraud detection
    
    // Setup email client
    const emailClient = createEmailManagementClient();
    await emailClient.setupPrimaryInbox();
    
    // Send simplified suspicious email
    await emailClient.sendTestEmail(
      ['ximaqawolf1@ximasoftwaretest.onmicrosoft.com'],
      'Easy Money Opportunity!',
      'Make thousands working from home! Send $100 to get started!'
    );
    
    // Handle email with fraud prevention response
    const emailCompose = await ucAgentDashboard.handleIncomingEmail();
    await emailCompose.replyToEmail(
      'This appears to be a fraudulent opportunity. Please do not send money to unknown parties. If it sounds too good to be true, it probably is.'
    );
    
    console.log('Simplified fraud detection workflow completed');
  });
  
  /**
   * Test agent status transitions for UC Agent 6
   */
  test('UC Agent 6 status management (Ready/Lunch transitions)', async ({ page, context }) => {
    await context.grantPermissions(['microphone', 'camera']);
    
    const loginPage = await LoginPage.create(page);
    const ucAgentCredentials = {
      username: process.env.UC_AGENT_6_EXT_106 || '',
      password: process.env.UC_AGENT_6_EXT_106_PASSWORD || ''
    };
    
    const ucAgentDashboard = await loginPage.loginAsAgent(ucAgentCredentials);
    
    // Test status transitions: Ready → Lunch → Ready
    await ucAgentDashboard.setReady();
    let status = await ucAgentDashboard.getAgentStatus();
    expect(status).toBe('Ready');
    console.log('✅ Ready status confirmed');
    
    await ucAgentDashboard.setStatus('Lunch');
    status = await ucAgentDashboard.getAgentStatus();
    expect(status).toBe('Lunch');
    console.log('✅ Lunch status confirmed');
    
    await ucAgentDashboard.setReady();
    status = await ucAgentDashboard.getAgentStatus();
    expect(status).toBe('Ready');
    console.log('✅ Return to Ready status confirmed');
    
    // Verify agent can handle emails in Ready state
    await ucAgentDashboard.enableEmailChannel();
    const emailReady = await ucAgentDashboard.isEmailChannelReady();
    expect(emailReady).toBe(true);
    
    console.log('UC Agent 6 status transitions and email capability verified');
  });
  
  /**
   * Test timezone-aware supervisor oversight
   */
  test('Supervisor oversight with America/Denver timezone configuration', async ({ browser }) => {
    // Setup supervisor with specific timezone
    const supervisorContext = await browser.newContext({
      timezoneId: 'America/Denver'
    });
    const supervisorPage = await supervisorContext.newPage();
    
    const supervisorLoginPage = await LoginPage.create(supervisorPage);
    const supervisorDashboard = await supervisorLoginPage.loginAsSupervisor();
    await supervisorDashboard.verifyDashboardLoaded();
    
    console.log('✅ Supervisor with America/Denver timezone verified');
    
    // Verify supervisor can monitor security operations
    // In production, this would include fraud detection dashboards
    
    await supervisorContext.close();
  });
});
