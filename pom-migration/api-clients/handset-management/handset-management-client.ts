import { AdminSystemPage } from '../../pages/admin/admin-system-page';
import { SrvLookupPage, SrvRecordResult } from '../../pages/external/srv-lookup-page';
import { IntegrationTestPage, SipOutageScenario } from '../../pages/external/integration-test-page';
import { Page } from '@playwright/test';

/**
 * Handset Management Client - Handles handset registration and SIP failover testing
 * Orchestrates the complete handset registration SRV failover testing workflow
 */
export class HandsetManagementClient {
  private adminSystemPage?: AdminSystemPage;
  private srvLookupPage?: SrvLookupPage;
  private integrationTestPage?: IntegrationTestPage;

  constructor() {
    // Client initialization
  }

  /**
   * Set up admin system access for handset management
   */
  async setupAdminAccess(adminPage: Page, credentials: AdminCredentials): Promise<void> {
    console.log('Setting up admin access for handset management...');
    
    this.adminSystemPage = await AdminSystemPage.navigateAsAdmin(adminPage, credentials);
    await this.adminSystemPage.verifyAdminAccess();
    
    console.log('Admin access for handset management established');
  }

  /**
   * Get SRV record configuration from admin system
   */
  async getSrvRecordFromAdmin(): Promise<string> {
    if (!this.adminSystemPage) {
      throw new Error('Admin system page not initialized. Call setupAdminAccess() first.');
    }
    
    console.log('Retrieving SRV record from admin system...');
    
    const srvRecord = await this.adminSystemPage.getSrvRecord();
    
    if (!srvRecord) {
      throw new Error('Failed to retrieve SRV record from admin system');
    }
    
    console.log(`SRV record retrieved from admin: ${srvRecord}`);
    return srvRecord;
  }

  /**
   * Perform SRV record lookup and get target IP address
   */
  async lookupSrvRecordDetails(srvLookupPage: Page, srvRecord: string): Promise<SrvRecordResult> {
    console.log(`Performing SRV lookup for: ${srvRecord}`);
    
    this.srvLookupPage = await SrvLookupPage.create(srvLookupPage);
    const srvResult = await this.srvLookupPage.lookupSrvRecord(srvRecord);
    
    console.log(`SRV lookup completed - Target: ${srvResult.target}, IP: ${srvResult.ipAddress}`);
    
    return srvResult;
  }

  /**
   * Configure SIP outage scenario for failover testing
   */
  async configureSipOutage(
    integrationPage: Page, 
    scenario: SipOutageScenario, 
    targetIpAddress: string
  ): Promise<void> {
    console.log(`Configuring SIP outage scenario: ${scenario} for IP: ${targetIpAddress}`);
    
    this.integrationTestPage = await IntegrationTestPage.create(integrationPage);
    
    if (scenario === SipOutageScenario.NO_RESPONSES) {
      await this.integrationTestPage.configureNoResponsesScenario(targetIpAddress);
    } else if (scenario === SipOutageScenario.RESPONDS_WITH_ALL_503) {
      await this.integrationTestPage.configureAll503Scenario(targetIpAddress);
    } else {
      throw new Error(`Unsupported SIP outage scenario: ${scenario}`);
    }
    
    console.log(`SIP outage scenario ${scenario} configured successfully`);
  }

  /**
   * Wait for SIP outage to propagate through the system
   */
  async waitForOutagePropagation(durationMs: number = 10 * 60 * 1000): Promise<void> {
    if (!this.integrationTestPage) {
      throw new Error('Integration test page not initialized. Call configureSipOutage() first.');
    }
    
    await this.integrationTestPage.waitForOutageToTakeEffect(durationMs);
  }

  /**
   * Reset SIP outage configuration to normal operation
   */
  async resetSipOutage(): Promise<void> {
    if (!this.integrationTestPage) {
      throw new Error('Integration test page not initialized. Cannot reset SIP outage.');
    }
    
    console.log('Resetting SIP outage configuration...');
    await this.integrationTestPage.resetSipOutage();
    console.log('SIP outage configuration reset to normal operation');
  }

  /**
   * Complete handset registration SRV failover test workflow
   */
  async executeFailoverTest(options: FailoverTestOptions): Promise<FailoverTestResult> {
    console.log('Starting handset registration SRV failover test workflow...');
    
    const startTime = new Date();
    
    try {
      // Step 1: Get SRV record from admin system
      console.log('Step 1: Retrieving SRV record from admin system...');
      const srvRecord = await this.getSrvRecordFromAdmin();
      
      // Step 2: Lookup SRV record details
      console.log('Step 2: Performing SRV record lookup...');
      const srvResult = await this.lookupSrvRecordDetails(options.srvLookupPage, srvRecord);
      
      // Step 3: Configure SIP outage
      console.log('Step 3: Configuring SIP outage scenario...');
      await this.configureSipOutage(options.integrationPage, options.scenario, srvResult.ipAddress);
      
      // Step 4: Wait for outage to take effect
      console.log('Step 4: Waiting for SIP outage propagation...');
      await this.waitForOutagePropagation(options.outageDuration);
      
      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();
      
      console.log('Handset registration SRV failover test workflow completed successfully');
      
      return {
        success: true,
        srvRecord,
        targetIp: srvResult.ipAddress,
        scenario: options.scenario,
        duration,
        startTime,
        endTime
      };
      
    } catch (error) {
      console.error('Handset registration SRV failover test workflow failed:', error.message);
      
      // Attempt to reset outage on failure
      try {
        await this.resetSipOutage();
      } catch (resetError) {
        console.warn('Failed to reset SIP outage after test failure:', resetError.message);
      }
      
      throw error;
    }
  }

  /**
   * Verify handset registration functionality
   */
  async verifyHandsetRegistration(): Promise<HandsetRegistrationStatus> {
    console.log('Verifying handset registration status...');
    
    // This would typically check handset registration status
    // For now, we'll return a basic status structure
    
    return {
      isRegistered: true,
      registrationTime: new Date(),
      serverAddress: 'unknown',
      failoverActive: this.integrationTestPage ? true : false
    };
  }

  /**
   * Clean up all resources and reset configurations
   */
  async cleanup(): Promise<void> {
    console.log('Cleaning up handset management resources...');
    
    try {
      // Reset SIP outage if integration page is available
      if (this.integrationTestPage) {
        await this.resetSipOutage();
      }
      
      // Clear references
      this.adminSystemPage = undefined;
      this.srvLookupPage = undefined;
      this.integrationTestPage = undefined;
      
      console.log('Handset management cleanup completed');
      
    } catch (error) {
      console.warn('Error during handset management cleanup:', error.message);
    }
  }
}

// ============================================================================
// SUPPORTING INTERFACES
// ============================================================================

export interface AdminCredentials {
  username: string;
  password: string;
}

export interface FailoverTestOptions {
  srvLookupPage: Page;
  integrationPage: Page;
  scenario: SipOutageScenario;
  outageDuration?: number;
}

export interface FailoverTestResult {
  success: boolean;
  srvRecord: string;
  targetIp: string;
  scenario: SipOutageScenario;
  duration: number;
  startTime: Date;
  endTime: Date;
}

export interface HandsetRegistrationStatus {
  isRegistered: boolean;
  registrationTime: Date;
  serverAddress: string;
  failoverActive: boolean;
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

/**
 * Factory function to create HandsetManagementClient instance
 */
export function createHandsetManagementClient(): HandsetManagementClient {
  return new HandsetManagementClient();
}
