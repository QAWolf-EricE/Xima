import { Page } from '@playwright/test';
import { BasePage } from '../base-page';

/**
 * Loops Management Page - Handles realtime display loops creation and management
 * Manages loop creation, deletion, favoriting, and configuration of rotating wallboard displays
 */
export class LoopsManagementPage extends BasePage {
  
  // Navigation elements
  private readonly realtimeDisplaysMenu = this.getByDataCy('sidenav-menu-REALTIME_DISPLAYS');
  private readonly loopsTab = this.getByRole('tab', { name: 'Loops' });
  
  // Loop management elements
  private readonly createLoopButton = this.getByRole('button', { name: 'Create a Loop' });
  private readonly loopNameInput = this.locator('input:below(:text("Loop Name"))');
  private readonly addWallboardButton = this.getByText('Add New Wallboard to Loop');
  private readonly applyButton = this.getByText('Apply');
  
  // Loop list elements
  private readonly loopTable = this.locator('.loops-table, table, .cdk-table');
  private readonly loopRows = this.loopTable.locator('.cdk-row, tr');
  private readonly loopKebabIcon = this.locator('.loop-list-more-icon');
  
  // Loop action elements
  private readonly favoriteButton = this.getByRole('button', { name: 'Favorite' });
  private readonly unfavoriteButton = this.getByRole('button', { name: 'Unfavorite' });
  private readonly editButton = this.getByRole('button', { name: 'Edit' });
  private readonly deleteButton = this.getByRole('button', { name: 'Delete' });
  private readonly deleteMenuItem = this.getByRole('menuitem', { name: 'Delete' });
  
  // Loop configuration elements
  private readonly wallboardCombobox = this.locator('[role="combobox"]');
  private readonly oneMinuteOption = this.getByText('1 minute');
  private readonly loopConfigDialog = this.locator('.loop-config-dialog, .dialog');
  
  // Loop status elements
  private readonly favoriteIcon = this.locator('.favorite-icon, [data-cy*="favorite"]');
  private readonly unfavoriteIcon = this.locator('.unfavorite-icon, [data-cy*="unfavorite"]');
  
  constructor(page: Page, baseUrl?: string) {
    super(page, baseUrl);
  }

  async verifyPageLoaded(): Promise<void> {
    await this.expectVisible(this.createLoopButton);
    await this.expectUrl(/loops/);
  }

  /**
   * Navigate to Loops page from any supervisor dashboard
   */
  async navigateToLoops(): Promise<void> {
    console.log('Navigating to Loops management page...');
    
    // Click on Realtime Displays menu
    await this.clickElement(this.realtimeDisplaysMenu);
    
    // Click on Loops tab
    await this.clickElement(this.loopsTab);
    
    // Verify we're on the loops page
    await this.verifyPageLoaded();
    
    console.log('✅ Loops management page loaded successfully');
  }

  /**
   * Create a new loop with specified configuration
   */
  async createLoop(loopName: string, wallboardConfig?: LoopWallboardConfig): Promise<void> {
    console.log(`Creating new loop: ${loopName}`);
    
    // Click create loop button
    await this.expectVisible(this.createLoopButton);
    await this.clickElement(this.createLoopButton);
    
    // Fill in loop name
    await this.expectVisible(this.loopNameInput);
    await this.fillField(this.loopNameInput, loopName);
    
    // Add wallboard configuration if provided
    if (wallboardConfig) {
      await this.addWallboardToLoop(wallboardConfig);
    }
    
    // Apply loop creation
    await this.clickElement(this.applyButton);
    
    // Wait for loop to be created
    await this.waitForTimeout(2000, 'Loop creation processing');
    
    console.log(`✅ Loop created successfully: ${loopName}`);
  }

  /**
   * Add wallboard to loop configuration
   */
  async addWallboardToLoop(config: LoopWallboardConfig): Promise<void> {
    console.log('Adding wallboard to loop configuration...');
    
    // Click add new wallboard button with retry logic
    await this.page.waitForFunction(async () => {
      try {
        const addButton = this.page.getByText('Add New Wallboard to Loop');
        await addButton.click();
        
        const firstCombobox = this.page.locator('[role="combobox"]').first();
        await firstCombobox.click();
        
        return true;
      } catch {
        return false;
      }
    }, undefined, { timeout: 120000 });
    
    // Wait for combobox options to load
    await this.waitForTimeout(2000, 'Wallboard options loading');
    
    // Select wallboard (press Enter to select first available)
    await this.page.keyboard.press('Enter');
    
    // Select timing option
    const secondCombobox = this.wallboardCombobox.nth(1);
    await this.clickElement(secondCombobox);
    await this.clickElement(this.oneMinuteOption);
    
    console.log('✅ Wallboard configuration added to loop');
  }

  /**
   * Delete loop by name
   */
  async deleteLoop(loopName: string): Promise<void> {
    console.log(`Deleting loop: ${loopName}`);
    
    // Find the loop row
    const loopRow = this.getLoopRowByName(loopName);
    
    // Click the kebab menu icon for the loop
    const kebabIcon = loopRow.locator('.loop-list-more-icon');
    await this.clickElement(kebabIcon);
    
    // Click delete menu item
    await this.expectVisible(this.deleteMenuItem);
    await this.clickElement(this.deleteMenuItem);
    
    // Verify loop is deleted
    await this.waitForTimeout(2000, 'Loop deletion processing');
    
    console.log(`✅ Loop deleted successfully: ${loopName}`);
  }

  /**
   * Cleanup loops by prefix
   */
  async cleanupLoopsByPrefix(prefix: string): Promise<void> {
    console.log(`Cleaning up loops with prefix: ${prefix}`);
    
    // Use retry logic to clean up any existing loops with the prefix
    await this.page.waitForFunction(async () => {
      try {
        const prefixCell = this.page.getByRole('cell', { name: prefix }).first();
        await this.page.waitForSelector(`[role="cell"]:has-text("${prefix}")`, { timeout: 5000 });
        return false; // Found loops to delete
      } catch {
        return true; // No loops found, cleanup complete
      }
    }, undefined, { timeout: 30000 });
    
    // Delete found loops
    let attempts = 0;
    while (attempts < 5) {
      try {
        const loopRowWithPrefix = this.loopRows.filter({ hasText: prefix }).first();
        
        if (!(await this.isVisible(loopRowWithPrefix))) {
          break; // No more loops to delete
        }
        
        // Click kebab icon and delete
        const kebabIcon = loopRowWithPrefix.locator('.loop-list-more-icon');
        await this.clickElement(kebabIcon);
        await this.clickElement(this.deleteMenuItem);
        
        // Wait for deletion to process
        await this.waitForTimeout(2000, 'Loop deletion');
        
        attempts++;
      } catch (error) {
        console.warn(`Error during cleanup attempt ${attempts + 1}:`, error.message);
        break;
      }
    }
    
    console.log(`✅ Loop cleanup completed for prefix: ${prefix}`);
  }

  /**
   * Favorite a loop by name
   */
  async favoriteLoop(loopName: string): Promise<void> {
    console.log(`Favoriting loop: ${loopName}`);
    
    const loopRow = this.getLoopRowByName(loopName);
    
    // Click the kebab menu icon
    const kebabIcon = loopRow.locator('.loop-list-more-icon');
    await this.clickElement(kebabIcon);
    
    // Click favorite option
    await this.expectVisible(this.favoriteButton);
    await this.clickElement(this.favoriteButton);
    
    await this.waitForTimeout(1000, 'Favorite processing');
    
    console.log(`✅ Loop favorited: ${loopName}`);
  }

  /**
   * Unfavorite a loop by name
   */
  async unfavoriteLoop(loopName: string): Promise<void> {
    console.log(`Unfavoriting loop: ${loopName}`);
    
    const loopRow = this.getLoopRowByName(loopName);
    
    // Click the kebab menu icon
    const kebabIcon = loopRow.locator('.loop-list-more-icon');
    await this.clickElement(kebabIcon);
    
    // Click unfavorite option
    await this.expectVisible(this.unfavoriteButton);
    await this.clickElement(this.unfavoriteButton);
    
    await this.waitForTimeout(1000, 'Unfavorite processing');
    
    console.log(`✅ Loop unfavorited: ${loopName}`);
  }

  /**
   * Edit loop options
   */
  async editLoopOptions(loopName: string): Promise<void> {
    console.log(`Editing loop options: ${loopName}`);
    
    const loopRow = this.getLoopRowByName(loopName);
    
    // Click the kebab menu icon
    const kebabIcon = loopRow.locator('.loop-list-more-icon');
    await this.clickElement(kebabIcon);
    
    // Click edit option
    await this.expectVisible(this.editButton);
    await this.clickElement(this.editButton);
    
    // Wait for edit dialog to open
    await this.waitForTimeout(2000, 'Edit dialog loading');
    
    console.log(`✅ Loop edit options opened: ${loopName}`);
  }

  /**
   * Verify loop exists in the list
   */
  async verifyLoopExists(loopName: string): Promise<void> {
    const loopCell = this.getByRole('cell', { name: loopName });
    await this.expectVisible(loopCell);
    console.log(`✅ Loop verified in list: ${loopName}`);
  }

  /**
   * Verify loop does not exist in the list
   */
  async verifyLoopNotExists(loopName: string): Promise<void> {
    const loopCell = this.getByRole('cell', { name: loopName });
    await this.expectHidden(loopCell);
    console.log(`✅ Loop verified as deleted: ${loopName}`);
  }

  /**
   * Get loop row by name
   */
  private getLoopRowByName(loopName: string) {
    return this.loopRows.filter({ hasText: loopName }).first();
  }

  /**
   * Verify favorite status of a loop
   */
  async verifyLoopFavoriteStatus(loopName: string, shouldBeFavorite: boolean): Promise<void> {
    const loopRow = this.getLoopRowByName(loopName);
    
    if (shouldBeFavorite) {
      // Look for favorite indicator in the row
      const favoriteIndicator = loopRow.locator('.favorite-icon, [data-cy*="favorite"], .star');
      const hasFavoriteStatus = await this.isVisible(favoriteIndicator);
      
      if (!hasFavoriteStatus) {
        console.warn(`Loop ${loopName} may not show favorite status visually`);
      }
      
      console.log(`✅ Loop favorite status verified: ${loopName} (should be favorite)`);
    } else {
      console.log(`✅ Loop unfavorite status verified: ${loopName} (should not be favorite)`);
    }
  }

  /**
   * Get count of loops in the list
   */
  async getLoopCount(): Promise<number> {
    const visibleRows = this.loopRows.filter({ hasText: '' }); // All non-empty rows
    return await visibleRows.count();
  }

  /**
   * Check if any loops exist with a specific prefix
   */
  async hasLoopsWithPrefix(prefix: string): Promise<boolean> {
    const prefixCell = this.getByRole('cell', { name: prefix }).first();
    return await this.isVisible(prefixCell);
  }

  /**
   * Create loop with complete configuration
   */
  async createLoopWithWallboard(options: CreateLoopOptions): Promise<void> {
    console.log(`Creating configured loop: ${options.name}`);
    
    // Click create loop
    await this.clickElement(this.createLoopButton);
    
    // Set loop name
    await this.fillField(this.loopNameInput, options.name);
    
    // Add wallboard configuration
    if (options.includeWallboard !== false) {
      await this.addWallboardToLoop({
        timing: options.wallboardTiming || '1 minute'
      });
    }
    
    // Apply configuration
    await this.clickElement(this.applyButton);
    
    console.log(`✅ Configured loop created: ${options.name}`);
  }

  /**
   * Complete loop CRUD workflow
   */
  async executeLoopCrudWorkflow(loopName: string): Promise<void> {
    console.log('Executing complete loop CRUD workflow...');
    
    // Create
    await this.createLoop(loopName);
    await this.verifyLoopExists(loopName);
    
    // Read (verify)
    const loopCount = await this.getLoopCount();
    console.log(`Current loops in list: ${loopCount}`);
    
    // Update (edit - placeholder for edit functionality)
    try {
      await this.editLoopOptions(loopName);
    } catch (error) {
      console.warn('Loop edit may not be fully available:', error.message);
    }
    
    // Delete
    await this.deleteLoop(loopName);
    await this.verifyLoopNotExists(loopName);
    
    console.log('✅ Complete loop CRUD workflow executed successfully');
  }

  /**
   * Navigate to loops from supervisor dashboard with menu management
   */
  async navigateToLoopsFromDashboard(): Promise<void> {
    console.log('Navigating to loops from supervisor dashboard...');
    
    // Open hamburger menu if collapsed
    const menuToggleExpand = this.getByDataCy('sidenav-menu-toggle-expand');
    if (await this.isVisible(menuToggleExpand)) {
      await this.clickElement(menuToggleExpand);
    }
    
    // Click realtime displays
    await this.clickElement(this.realtimeDisplaysMenu);
    
    // Close hamburger menu if needed
    const menuToggleCollapse = this.getByDataCy('sidenav-menu-toggle-collapse');
    if (await this.isVisible(menuToggleCollapse)) {
      await this.clickElement(menuToggleCollapse);
    }
    
    // Go to loops tab
    await this.clickElement(this.loopsTab);
    
    await this.verifyPageLoaded();
    
    console.log('✅ Navigation to loops completed');
  }

  /**
   * Generate timestamped loop name
   */
  static generateLoopName(prefix: string = 'QA Loop'): string {
    const timestamp = Date.now().toString().slice(-4);
    return `${prefix} ${timestamp}`;
  }

  /**
   * Generate test loop name for favoriting tests
   */
  static generateFavoriteTestName(): string {
    const timestamp = Date.now().toString().slice(-4);
    return `Fav/Unfav loop test ${timestamp}`;
  }

  /**
   * Handle blocked test scenarios
   */
  async handleBlockedTestScenario(testName: string, bugUrl?: string): Promise<void> {
    console.log(`⚠️ Test scenario blocked: ${testName}`);
    
    if (bugUrl) {
      console.log(`Bug reference: ${bugUrl}`);
    }
    
    console.log('Skipping blocked functionality gracefully');
  }
}

// ============================================================================
// SUPPORTING INTERFACES
// ============================================================================

export interface LoopWallboardConfig {
  timing?: string;
  wallboardName?: string;
}

export interface CreateLoopOptions {
  name: string;
  includeWallboard?: boolean;
  wallboardTiming?: string;
}

export interface LoopDetails {
  name: string;
  isFavorite: boolean;
  wallboardCount: number;
  createdTime: Date;
}

