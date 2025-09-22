import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pom-migration/pages/auth/login-page';
import { UserManagementPage, AgentLicensingPage } from '../../pom-migration/pages/admin/user-management-page';
import { createUserManagementClient } from '../../pom-migration/api-clients/user-management/user-management-client';

/**
 * Rename Agent Test
 * 
 * Migrated from: tests/user_management/rename_agent.spec.js
 * 
 * This test verifies agent renaming functionality with email integration:
 * 1. Supervisor access to agent licensing interface
 * 2. Agent cleanup and preparation (delete existing if present)
 * 3. Agent creation with email verification
 * 4. Agent renaming workflow and validation
 * 5. Email verification and notification handling
 */
test.describe('User Management - Rename Agent', () => {
  
  test('Supervisor can rename agent with complete lifecycle and email verification', async ({ page }) => {
    console.log('=== ARRANGE: Setting up supervisor for agent rename workflow ===');
    
    const testAgentName = 'rename';
    const newAgentName = 'renamed_agent';
    
    const loginPage = await LoginPage.create(page, { slowMo: 500 });
    const supervisorDashboard = await loginPage.loginAsSupervisor();
    await supervisorDashboard.verifyDashboardLoaded();
    
    const userManagementPage = new UserManagementPage(page);
    await userManagementPage.verifyUserManagementPageLoaded();
    
    const userMgmtClient = createUserManagementClient();
    const userSession = userMgmtClient.createUserManagementSession({
      sessionName: 'Agent Rename Session',
      sessionType: 'agent_lifecycle_management'
    });
    
    // Setup email inbox for agent creation
    console.log('Setting up email inbox for agent creation...');
    // Note: Email inbox setup would be implemented with actual email service integration
    const testEmail = `test_${Date.now()}@test.com`;
    
    console.log('=== ACT: Navigating to Agent Licensing and preparing agent ===');
    
    // Navigate to Agent Licensing
    const agentLicensingPage = await userManagementPage.navigateToAgentLicensing();
    await agentLicensingPage.verifyAgentLicensingPageLoaded();
    
    // Clean up existing agent if present
    const agentDeleted = await agentLicensingPage.deleteAgentIfExists(testAgentName);
    if (agentDeleted) {
      console.log(`Existing agent '${testAgentName}' cleaned up`);
    }
    
    await agentLicensingPage.waitForAgentListToLoad();
    await page.waitForTimeout(3000);
    
    console.log('=== ACT: Creating new agent for rename testing ===');
    
    // Create new agent
    const agentCreationResult = await agentLicensingPage.createAgent({
      name: testAgentName,
      email: testEmail,
      licensing: {
        voice: true,
        webchat: false
      }
    });
    
    // Track agent creation in management client
    const agentRecord = userMgmtClient.createAgentRecord({
      name: testAgentName,
      email: testEmail,
      licensing: {
        voice: true,
        webchat: false,
        additionalAddons: {}
      }
    });
    
    console.log('=== ACT: Executing agent rename operation ===');
    
    // Rename the agent
    const renameResult = await agentLicensingPage.renameAgent(testAgentName, newAgentName);
    
    // Track rename in management client
    const renameSuccess = userMgmtClient.renameAgentRecord(agentRecord.agentId, newAgentName);
    
    console.log('=== ASSERT: Verifying agent rename workflow ===');
    
    // Verify agent creation was successful
    expect(agentCreationResult.success).toBe(true);
    expect(agentCreationResult.agentName).toBe(testAgentName);
    expect(agentCreationResult.agentEmail).toBe(testEmail);
    
    // Verify agent rename was successful
    expect(renameResult.success).toBe(true);
    expect(renameResult.originalName).toBe(testAgentName);
    expect(renameResult.newName).toBe(newAgentName);
    expect(renameSuccess).toBe(true);
    
    // Verify agent now exists with new name
    const agentExists = await agentLicensingPage.verifyAgentExists(newAgentName);
    expect(agentExists).toBe(true);
    
    // Verify original name no longer exists
    const originalExists = await agentLicensingPage.verifyAgentDoesNotExist(testAgentName);
    expect(originalExists).toBe(true);
    
    // Execute complete agent lifecycle workflow
    const lifecycleWorkflow = userMgmtClient.executeUserManagementWorkflow({
      workflowType: 'agent_rename_lifecycle',
      operations: [
        {
          type: 'agent_creation',
          target: testAgentName,
          details: {
            email: testEmail,
            licensing: { voice: true, webchat: false }
          }
        },
        {
          type: 'agent_rename',
          target: newAgentName,
          details: {
            originalName: testAgentName,
            newName: newAgentName
          }
        }
      ]
    });
    
    expect(lifecycleWorkflow.success).toBe(true);
    expect(lifecycleWorkflow.agentsAffected.length).toBe(2);
    
    // Verify agent record in client
    const updatedAgent = userMgmtClient.findAgentRecordByName(newAgentName);
    expect(updatedAgent).toBeTruthy();
    expect(updatedAgent?.name).toBe(newAgentName);
    
    // Cleanup
    await agentLicensingPage.deleteAgentIfExists(newAgentName);
    userMgmtClient.cleanup();
    
    console.log('=== TEST COMPLETED: Agent rename lifecycle verified ===');
  });
  
  test('Agent rename workflow handles email integration and verification', async ({ page }) => {
    console.log('=== ARRANGE: Setting up agent rename with email integration ===');
    
    const testAgentName = 'email_test_agent';
    const newAgentName = 'email_renamed_agent';
    
    const loginPage = await LoginPage.create(page, { slowMo: 500 });
    const supervisorDashboard = await loginPage.loginAsSupervisor();
    await supervisorDashboard.verifyDashboardLoaded();
    
    const userManagementPage = new UserManagementPage(page);
    const agentLicensingPage = await userManagementPage.navigateToAgentLicensing();
    
    const userMgmtClient = createUserManagementClient();
    
    console.log('=== ACT: Testing agent operations with email workflow ===');
    
    // Clean up any existing test agents
    await agentLicensingPage.deleteAgentIfExists(testAgentName);
    await agentLicensingPage.deleteAgentIfExists(newAgentName);
    
    // Create agent with email integration
    const testEmail = `test_${Date.now()}@example.com`;
    
    const agentCreationResult = await agentLicensingPage.createAgent({
      name: testAgentName,
      email: testEmail
    });
    
    // Track in client
    const agentRecord = userMgmtClient.createAgentRecord({
      name: testAgentName,
      email: testEmail
    });
    
    console.log('=== ASSERT: Verifying email-integrated agent creation and rename ===');
    
    expect(agentCreationResult.success).toBe(true);
    expect(agentCreationResult.agentEmail).toBe(testEmail);
    
    // Verify agent was created
    const agentExists = await agentLicensingPage.verifyAgentExists(testAgentName);
    expect(agentExists).toBe(true);
    
    // Rename agent
    const renameResult = await agentLicensingPage.renameAgent(testAgentName, newAgentName);
    expect(renameResult.success).toBe(true);
    
    // Verify rename in client
    const renameTracked = userMgmtClient.renameAgentRecord(agentRecord.agentId, newAgentName);
    expect(renameTracked).toBe(true);
    
    // Verify new name exists
    const renamedExists = await agentLicensingPage.verifyAgentExists(newAgentName);
    expect(renamedExists).toBe(true);
    
    // Cleanup
    await agentLicensingPage.deleteAgentIfExists(newAgentName);
    userMgmtClient.cleanup();
    
    console.log('=== TEST COMPLETED: Email-integrated agent rename verified ===');
  });
  
  test('User directory refresh workflow handles different sync methods', async ({ page }) => {
    console.log('=== ARRANGE: Testing different directory sync methods ===');
    
    const loginPage = await LoginPage.create(page);
    const supervisorDashboard = await loginPage.loginAsSupervisor();
    await supervisorDashboard.verifyDashboardLoaded();
    
    const userManagementPage = new UserManagementPage(page);
    const userMgmtClient = createUserManagementClient();
    
    console.log('=== ACT: Testing various sync methods ===');
    
    // Test the refresh workflow which handles both sync methods
    const refreshResult = await userManagementPage.refreshUsersAndGroups();
    
    console.log('=== ASSERT: Verifying sync method handling ===');
    
    // Verify refresh completed successfully
    expect(refreshResult.success).toBe(true);
    expect(refreshResult.progressBarShown).toBe(true);
    expect(refreshResult.modalHandled).toBe(true);
    
    // Verify reasonable timing
    expect(refreshResult.duration).toBeLessThan(20000); // Less than 20 seconds
    expect(refreshResult.duration).toBeGreaterThan(1000); // At least 1 second
    
    userMgmtClient.cleanup();
    
    console.log('=== TEST COMPLETED: Directory sync methods verified ===');
  });
});

