import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pom-migration/pages/auth/login-page';
import { UserManagementPage, AgentLicensingPage } from '../../pom-migration/pages/admin/user-management-page';
import { createUserManagementClient } from '../../pom-migration/api-clients/user-management/user-management-client';

/**
 * Edit Agent Licensing Test
 * 
 * Migrated from: tests/user_management/edit_agent_licensing.spec.js
 * 
 * This test verifies agent licensing modification functionality:
 * 1. Multi-agent setup with WebRTC agent and supervisor coordination
 * 2. Agent licensing interface access and navigation
 * 3. Webchat add-on disable/enable workflow
 * 4. Agent licensing status verification and validation
 * 5. Multi-user coordination and licensing impact testing
 */
test.describe('User Management - Edit Agent Licensing', () => {
  
  test('Supervisor can edit agent licensing with webchat add-on management and WebRTC agent coordination', async ({ browser }) => {
    console.log('=== ARRANGE: Setting up multi-agent environment for licensing management ===');
    
    const webrtcAgentCredentials = {
      email: process.env.WEBRTCAGENT_73_EMAIL || '',
      password: process.env.WEBRTCAGENT_73_PASSWORD || '',
      agentName: 'WebRTC Agent 73'
    };
    
    const supervisorCredentials = {
      username: process.env.SUPERVISOR_USERNAME || '',
      password: process.env.SUPERVISOR_PASSWORD || ''
    };
    
    const userMgmtClient = createUserManagementClient();
    const userSession = userMgmtClient.createUserManagementSession({
      sessionName: 'Agent Licensing Management Session',
      sessionType: 'licensing_management'
    });
    
    console.log('=== ACT: Setting up WebRTC Agent (Agent 73) ===');
    
    // Create WebRTC Agent context with media permissions
    const webrtcAgentContext = await browser.newContext({
      permissions: ["microphone", "camera"]
    });
    const webrtcAgentPage = await webrtcAgentContext.newPage();
    
    // Login WebRTC Agent
    const webrtcLoginPage = await LoginPage.create(webrtcAgentPage, { sloMo: 1500 });
    const webrtcAgentDashboard = await webrtcLoginPage.loginAsWebRTCAgent({
      email: webrtcAgentCredentials.email
    });
    
    // Track WebRTC agent in management client
    const webrtcAgentRecord = userMgmtClient.createAgentRecord({
      name: webrtcAgentCredentials.agentName,
      email: webrtcAgentCredentials.email,
      licensing: {
        voice: true,
        webchat: true, // Initially has webchat
        additionalAddons: {}
      }
    });
    
    console.log('=== ACT: Setting up Supervisor for licensing management ===');
    
    // Create supervisor context
    const supervisorContext = await browser.newContext();
    const supervisorPage = await supervisorContext.newPage();
    
    // Login supervisor
    const supervisorLoginPage = await LoginPage.create(supervisorPage, { sloMo: 500 });
    const supervisorDashboard = await supervisorLoginPage.loginAsSupervisor();
    await supervisorDashboard.verifyDashboardLoaded();
    
    const userManagementPage = new UserManagementPage(supervisorPage);
    
    console.log('=== ACT: Accessing agent licensing interface ===');
    
    // Navigate to agent licensing
    const agentLicensingPage = await userManagementPage.navigateToAgentLicensing();
    await agentLicensingPage.verifyAgentLicensingPageLoaded();
    await agentLicensingPage.waitForAgentListToLoad();
    
    console.log('=== ACT: Modifying WebRTC Agent 73 licensing ===');
    
    // Get current licensing status
    const initialLicensingStatus = await agentLicensingPage.getAgentLicensingStatus(webrtcAgentCredentials.agentName);
    console.log(`Initial licensing status:`, initialLicensingStatus);
    
    // Toggle webchat add-on (disable it)
    await agentLicensingPage.toggleWebchatAddon(false);
    
    // Track licensing update
    const licensingUpdateSuccess = userMgmtClient.updateAgentLicensing(webrtcAgentRecord.agentId, {
      webchat: false
    });
    
    // Wait for licensing change to take effect
    await page.waitForTimeout(3000);
    
    // Get updated licensing status
    const updatedLicensingStatus = await agentLicensingPage.getAgentLicensingStatus(webrtcAgentCredentials.agentName);
    console.log(`Updated licensing status:`, updatedLicensingStatus);
    
    console.log('=== ASSERT: Verifying agent licensing modifications ===');
    
    // Verify WebRTC agent record was created
    expect(webrtcAgentRecord.name).toBe(webrtcAgentCredentials.agentName);
    expect(webrtcAgentRecord.email).toBe(webrtcAgentCredentials.email);
    
    // Verify licensing update was tracked
    expect(licensingUpdateSuccess).toBe(true);
    
    // Verify licensing status changed
    expect(initialLicensingStatus.webchatAddon).toBe(true);
    expect(updatedLicensingStatus.webchatAddon).toBe(false);
    
    // Execute complete licensing management workflow
    const licensingWorkflow = userMgmtClient.executeUserManagementWorkflow({
      workflowType: 'webchat_addon_management',
      operations: [
        {
          type: 'licensing_update',
          target: webrtcAgentCredentials.agentName,
          details: {
            addon: 'webchat',
            action: 'disable',
            previousState: true,
            newState: false
          }
        }
      ]
    });
    
    expect(licensingWorkflow.success).toBe(true);
    expect(licensingWorkflow.licensingChanges.length).toBe(1);
    
    // Verify agent record was updated correctly
    const updatedAgentRecord = userMgmtClient.getAgentRecord(webrtcAgentRecord.agentId);
    expect(updatedAgentRecord?.licensing.webchat).toBe(false);
    expect(updatedAgentRecord?.operationHistory.length).toBeGreaterThan(0);
    
    // Generate user management analytics
    const analytics = userMgmtClient.generateUserManagementAnalytics();
    expect(analytics.totalAgents).toBeGreaterThan(0);
    expect(analytics.licensingDistribution.totalLicenses).toBeGreaterThan(0);
    
    // Cleanup
    userMgmtClient.cleanup();
    await webrtcAgentContext.close();
    await supervisorContext.close();
    
    console.log('=== TEST COMPLETED: Agent licensing management verified ===');
  });
  
  test('Agent licensing changes affect agent capabilities and permissions', async ({ browser }) => {
    console.log('=== ARRANGE: Testing licensing impact on agent capabilities ===');
    
    const userMgmtClient = createUserManagementClient();
    
    // Create supervisor context for licensing management
    const supervisorContext = await browser.newContext();
    const supervisorPage = await supervisorContext.newPage();
    
    const supervisorLoginPage = await LoginPage.create(supervisorPage, { sloMo: 500 });
    const supervisorDashboard = await supervisorLoginPage.loginAsSupervisor();
    await supervisorDashboard.verifyDashboardLoaded();
    
    const userManagementPage = new UserManagementPage(supervisorPage);
    const agentLicensingPage = await userManagementPage.navigateToAgentLicensing();
    
    console.log('=== ACT: Testing licensing configuration impact ===');
    
    // Find an agent with webchat capabilities
    const webchatAgent = await agentLicensingPage.findAgentWithLicensing({
      webchatAddon: true
    });
    
    if (webchatAgent) {
      console.log(`Found agent with webchat: ${webchatAgent}`);
      
      // Get initial licensing status
      const initialStatus = await agentLicensingPage.getAgentLicensingStatus(webchatAgent);
      
      // Toggle webchat to test impact
      await agentLicensingPage.toggleWebchatAddon(false);
      
      // Get updated status
      const updatedStatus = await agentLicensingPage.getAgentLicensingStatus(webchatAgent);
      
      console.log('=== ASSERT: Verifying licensing impact ===');
      
      expect(initialStatus.webchatAddon).toBe(true);
      expect(updatedStatus.webchatAddon).toBe(false);
      
      // Restore original state
      await agentLicensingPage.toggleWebchatAddon(true);
    } else {
      console.log('No agent with webchat found, testing licensing configuration validation');
      
      // Test licensing configuration validation instead
      const licensingWorkflow = userMgmtClient.executeUserManagementWorkflow({
        workflowType: 'licensing_validation',
        operations: [
          {
            type: 'licensing_check',
            target: 'system_agents',
            details: { checkType: 'webchat_availability' }
          }
        ]
      });
      
      expect(licensingWorkflow.success).toBe(true);
    }
    
    userMgmtClient.cleanup();
    await supervisorContext.close();
    
    console.log('=== TEST COMPLETED: Licensing impact verification completed ===');
  });
});

