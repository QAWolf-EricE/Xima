import { Page } from '@playwright/test';
import { BasePage } from '../base-page';

/**
 * Integration Test Page - Handles SIP outage test parameter configuration
 * Manages failover testing scenarios for handset registration testing
 */
export class IntegrationTestPage extends BasePage {
  
  // Page URL
  private readonly integrationTestUrl = 'https://dev-bwhit.chronicallcloud-staging.com/service/primary/diag?page=integrationTestPage';
  
  // Form elements
  private readonly scenarioSelect = this.locator('[name="scenario"]');
  private readonly ipAddressInput = this.locator('input[name="ipAddress"]');
  private readonly setSipOutageButton = this.getByRole('button', { name: 'Set SIP Outage Test Parameters' });
  
  // Status elements
  private readonly statusMessage = this.locator('.status-message, .result-message');
  private readonly configurationPanel = this.locator('.configuration-panel, .test-panel');
  
  constructor(page: Page) {
    super(page, 'https://dev-bwhit.chronicallcloud-staging.com');
  }

  /**
   * Navigate to Integration Test page
   */
  async open(): Promise<IntegrationTestPage> {
    await this.page.goto(this.integrationTestUrl);
    await this.verifyPageLoaded();
    return this;
  }

  async verifyPageLoaded(): Promise<void> {
    await this.expectVisible(this.scenarioSelect, 30000);
    await this.expectVisible(this.ipAddressInput);
    await this.expectVisible(this.setSipOutageButton);
    console.log('Integration Test page loaded successfully');
  }

  /**
   * Set SIP outage test parameters
   */
  async setSipOutageParameters(scenario: SipOutageScenario, ipAddress: string): Promise<void> {
    console.log(`Setting SIP outage parameters: ${scenario}, IP: ${ipAddress}`);
    
    // Select the outage scenario
    await this.selectOption(this.scenarioSelect, scenario);
    console.log(`Selected scenario: ${scenario}`);
    
    // Fill the IP address
    await this.fillField(this.ipAddressInput, ipAddress);
    console.log(`Set IP address: ${ipAddress}`);
    
    // Click the button to apply settings
    await this.clickElement(this.setSipOutageButton);
    
    // Wait for configuration to apply
    await this.waitForTimeout(2000, 'SIP outage configuration processing');
    
    console.log('SIP outage parameters applied successfully');
  }

  /**
   * Reset SIP outage configuration to normal operation
   */
  async resetSipOutage(): Promise<void> {
    console.log('Resetting SIP outage configuration...');
    
    // Select NO_OUTAGE scenario
    await this.selectOption(this.scenarioSelect, SipOutageScenario.NO_OUTAGE);
    
    // Clear the IP address field
    await this.fillField(this.ipAddressInput, '', { clear: true });
    
    // Apply the reset configuration
    await this.clickElement(this.setSipOutageButton);
    
    // Wait for reset to take effect
    await this.waitForTimeout(2000, 'SIP outage reset processing');
    
    console.log('SIP outage configuration reset to normal operation');
  }

  /**
   * Configure NO_RESPONSES scenario for testing
   */
  async configureNoResponsesScenario(targetIpAddress: string): Promise<void> {
    console.log('Configuring NO_RESPONSES scenario for SIP failover testing...');
    
    await this.setSipOutageParameters(SipOutageScenario.NO_RESPONSES, targetIpAddress);
    
    console.log('NO_RESPONSES scenario configured - SIP servers will not respond');
  }

  /**
   * Configure RESPONDS_WITH_ALL_503 scenario for testing
   */
  async configureAll503Scenario(targetIpAddress: string): Promise<void> {
    console.log('Configuring RESPONDS_WITH_ALL_503 scenario for SIP failover testing...');
    
    await this.setSipOutageParameters(SipOutageScenario.RESPONDS_WITH_ALL_503, targetIpAddress);
    
    console.log('RESPONDS_WITH_ALL_503 scenario configured - SIP servers will respond with 503 errors');
  }

  /**
   * Wait for outage scenario to take effect (typically 10 minutes as per original tests)
   */
  async waitForOutageToTakeEffect(durationMs: number = 10 * 60 * 1000): Promise<void> {
    console.log(`Waiting for SIP outage scenario to take effect (${durationMs / 60000} minutes)...`);
    
    // This is a critical wait period for the SIP infrastructure to recognize the outage
    await this.waitForTimeout(durationMs, 'SIP outage propagation');
    
    console.log('SIP outage scenario should now be active');
  }

  /**
   * Verify current outage configuration
   */
  async verifyOutageConfiguration(expectedScenario: SipOutageScenario, expectedIpAddress?: string): Promise<void> {
    const currentScenario = await this.scenarioSelect.inputValue();
    
    if (currentScenario !== expectedScenario) {
      throw new Error(`Outage scenario mismatch. Expected: ${expectedScenario}, Current: ${currentScenario}`);
    }
    
    if (expectedIpAddress) {
      const currentIpAddress = await this.ipAddressInput.inputValue();
      if (currentIpAddress !== expectedIpAddress) {
        throw new Error(`IP address mismatch. Expected: ${expectedIpAddress}, Current: ${currentIpAddress}`);
      }
    }
    
    console.log(`Outage configuration verified: ${expectedScenario}`);
  }

  /**
   * Get current configuration status
   */
  async getCurrentConfiguration(): Promise<SipOutageConfiguration> {
    const scenario = await this.scenarioSelect.inputValue() as SipOutageScenario;
    const ipAddress = await this.ipAddressInput.inputValue();
    
    return {
      scenario,
      ipAddress,
      isActive: scenario !== SipOutageScenario.NO_OUTAGE
    };
  }

  /**
   * Handle configuration errors or warnings
   */
  async checkForConfigurationErrors(): Promise<string[]> {
    const errors: string[] = [];
    
    // Check for common error messages
    const errorSelectors = [
      '.error-message',
      '.warning-message', 
      '[class*="error"]',
      '[class*="warning"]'
    ];
    
    for (const selector of errorSelectors) {
      const elements = this.locator(selector);
      const count = await elements.count();
      
      for (let i = 0; i < count; i++) {
        const text = await elements.nth(i).textContent();
        if (text && text.trim()) {
          errors.push(text.trim());
        }
      }
    }
    
    if (errors.length > 0) {
      console.warn('Configuration errors detected:', errors);
    }
    
    return errors;
  }

  /**
   * Static factory method for creating and navigating to integration test page
   */
  static async create(page: Page): Promise<IntegrationTestPage> {
    const integrationTestPage = new IntegrationTestPage(page);
    await integrationTestPage.open();
    return integrationTestPage;
  }
}

// ============================================================================
// SUPPORTING ENUMS AND INTERFACES
// ============================================================================

export enum SipOutageScenario {
  NO_OUTAGE = 'NO_OUTAGE',
  NO_RESPONSES = 'NO_RESPONSES',
  RESPONDS_WITH_ALL_503 = 'RESPONDS_WITH_ALL_503'
}

export interface SipOutageConfiguration {
  scenario: SipOutageScenario;
  ipAddress: string;
  isActive: boolean;
}
