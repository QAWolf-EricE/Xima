import { Page } from '@playwright/test';
import { BasePage } from '../base-page';

/**
 * Wallboards Management Page - Handles realtime wallboard creation and management
 * Manages wallboard templates, widget configuration, and wallboard lifecycle operations
 */
export class WallboardsManagementPage extends BasePage {
  
  // Navigation elements
  private readonly realtimeDisplaysMenu = this.getByDataCy('sidenav-menu-REALTIME_DISPLAYS');
  private readonly realtimeWallboardsOption = this.getByText('Realtime Wallboards');
  
  // Main interface elements
  private readonly newWallboardButton = this.locator('button:has-text("New Wallboard")');
  private readonly wallboardItems = this.getByDataCy('realtime-wallboards-item');
  private readonly searchInput = this.locator('[placeholder="Type to Search"]');
  
  // Template selection elements
  private readonly templateSelectionHeader = this.getByRole('heading', { name: 'Select a template' });
  private readonly singleSkillTemplate = this.locator('app-wallboard-select-template-tiles-item:has-text("Single Skill")');
  private readonly twoSkillsTemplate = this.locator('app-wallboard-select-template-tiles-item:has-text("Two Skills")');
  private readonly customTemplate = this.locator('app-wallboard-select-template-tiles-item:has-text("Custom")');
  private readonly agentAndSkillTemplate = this.locator('app-wallboard-select-template-tiles-item:has-text("Agent and Skill")');
  private readonly callbacksTemplate = this.locator('app-wallboard-select-template-tiles-item:has-text("Callbacks")');
  private readonly callsAndWebChatsTemplate = this.locator('app-wallboard-select-template-tiles-item:has-text("Calls and Web Chats")');
  private readonly slaTemplate = this.locator('app-wallboard-select-template-tiles-item:has-text("SLA")');
  private readonly dailySlaVoiceTemplate = this.locator('app-wallboard-select-template-tiles-item:has-text("Daily SLA Voice")');
  private readonly fourSkillsTemplate = this.locator('app-wallboard-select-template-tiles-item:has-text("4 Skills")');
  
  // Template configuration elements
  private readonly templateConfigHeader = this.locator('.xima-dialog-header:text-is("Template Configuration")');
  private readonly wallboardTitleInput = this.locator('[formcontrolname="title"]');
  private readonly editButton = this.locator('[data-mat-icon-name="edit"]');
  private readonly selectAllCheckbox = this.getByDataCy('checkbox-tree-property-select-all');
  private readonly listSelectAllCheckbox = this.getByDataCy('xima-list-select-select-all');
  private readonly applyButton = this.locator('button:has-text("Apply")');
  private readonly continueButton = this.getByRole('button', { name: 'Continue' });
  
  // Wallboard preview elements
  private readonly wallboardPreviewMenu = this.locator('[aria-haspopup="menu"] [role="img"]:visible');
  private readonly goToPreviewMenuItem = this.getByRole('menuitem', { name: 'Go to Preview' });
  private readonly editWallboardMenuItem = this.getByRole('menuitem', { name: 'Edit Wallboard' });
  private readonly saveAndExitButton = this.getByRole('button', { name: 'Save and Exit' });
  
  // Wallboard management elements
  private readonly wallboardMenuButton = this.getByDataCy('realtime-wallboards-item-menu-button');
  private readonly duplicateOption = this.getByText('Duplicate');
  private readonly shareOption = this.getByText('Share');
  private readonly exportOption = this.getByText('Export');
  private readonly deleteOption = this.getByDataCy('realtime-wallboards-item-delete');
  private readonly openOption = this.getByText('Open');
  private readonly editOption = this.getByText('Edit');
  
  // Dialog and confirmation elements
  private readonly confirmationDialog = this.locator('.confirmation-dialog');
  private readonly confirmationOkayButton = this.getByDataCy('confirmation-dialog-okay-button');
  private readonly promptInput = this.getByDataCy('app-prompt-input');
  private readonly submitButton = this.locator('button:has-text("Submit")');
  
  constructor(page: Page, baseUrl?: string) {
    super(page, baseUrl);
  }

  async verifyPageLoaded(): Promise<void> {
    await this.expectVisible(this.newWallboardButton);
    await this.expectVisible(this.wallboardItems.first());
  }

  /**
   * Navigate to Wallboards management
   */
  async navigateToWallboards(): Promise<void> {
    console.log('Navigating to Wallboards management...');
    
    // Hover over Realtime Displays menu
    await this.hoverElement(this.realtimeDisplaysMenu);
    
    // Click Realtime Wallboards option
    await this.clickElement(this.realtimeWallboardsOption);
    
    // Wait for page to load
    await this.expectVisible(this.newWallboardButton, 60000);
    await this.expectVisible(this.wallboardItems.first(), 60000);
    
    console.log('✅ Wallboards management page loaded');
  }

  /**
   * Create wallboard from template
   */
  async createWallboardFromTemplate(options: CreateWallboardOptions): Promise<void> {
    console.log(`Creating wallboard: ${options.name} using ${options.template} template`);
    
    // Click New Wallboard
    await this.clickElement(this.newWallboardButton);
    
    // Wait for template selection
    await this.expectVisible(this.templateSelectionHeader);
    
    // Select appropriate template
    const templateElement = this.getTemplateElement(options.template);
    await templateElement.scrollIntoViewIfNeeded();
    await this.clickElement(templateElement);
    
    // Configure template
    await this.configureWallboardTemplate(options);
    
    console.log(`✅ Wallboard created: ${options.name}`);
  }

  /**
   * Configure wallboard template settings
   */
  async configureWallboardTemplate(options: CreateWallboardOptions): Promise<void> {
    console.log('Configuring wallboard template settings...');
    
    // Wait for template configuration dialog
    await this.expectVisible(this.templateConfigHeader);
    
    // Fill wallboard title
    await this.fillField(this.wallboardTitleInput, options.name);
    
    // Configure first parameter (skills/properties)
    if (options.configureSkills !== false) {
      await this.clickElement(this.editButton.nth(0));
      await this.clickElement(this.selectAllCheckbox);
      await this.clickElement(this.applyButton);
    }
    
    // Configure second parameter (agents/lists)
    if (options.configureAgents !== false) {
      await this.clickElement(this.editButton.nth(1));
      await this.clickElement(this.listSelectAllCheckbox);
      await this.clickElement(this.applyButton);
    }
    
    // Continue with configuration
    await this.expectEnabled(this.continueButton);
    await this.clickElement(this.continueButton);
    
    console.log('✅ Wallboard template configuration completed');
  }

  /**
   * Preview wallboard and verify content
   */
  async previewWallboard(expectedElements: string[]): Promise<void> {
    console.log('Previewing wallboard content...');
    
    // Navigate to wallboard preview
    await this.clickElement(this.wallboardPreviewMenu);
    await this.clickElement(this.goToPreviewMenuItem, { timeout: 8 * 60 * 1000 });
    
    // Verify expected elements in preview
    for (const element of expectedElements) {
      const elementLocator = this.locator(`.text-base:has-text("${element}")`);
      await this.expectVisible(elementLocator);
      console.log(`✅ Preview element verified: ${element}`);
    }
    
    console.log('✅ Wallboard preview verification completed');
  }

  /**
   * Save wallboard after preview
   */
  async saveWallboard(): Promise<void> {
    console.log('Saving wallboard...');
    
    // Navigate to edit from preview
    await this.clickElement(this.wallboardPreviewMenu);
    await this.clickElement(this.editWallboardMenuItem);
    
    // Save and exit
    await this.expectEnabled(this.saveAndExitButton);
    await this.clickElement(this.saveAndExitButton, { timeout: 8 * 60 * 1000 });
    
    console.log('✅ Wallboard saved successfully');
  }

  /**
   * Delete wallboard by name
   */
  async deleteWallboard(wallboardName: string): Promise<void> {
    console.log(`Deleting wallboard: ${wallboardName}`);
    
    // Search for wallboard
    await this.searchWallboard(wallboardName);
    
    // Click wallboard menu button
    const menuButton = this.locator(`[data-cy="realtime-wallboards-item-menu-button"]:right-of(:text("${wallboardName}"))`);
    await this.clickElement(menuButton);
    
    // Click delete option
    await this.clickElement(this.deleteOption);
    
    // Confirm deletion
    await this.clickElement(this.confirmationOkayButton);
    
    await this.waitForTimeout(2000, 'Wallboard deletion processing');
    
    console.log(`✅ Wallboard deleted: ${wallboardName}`);
  }

  /**
   * Cleanup wallboards by prefix or name
   */
  async cleanupWallboards(nameOrPrefix: string): Promise<void> {
    console.log(`Cleaning up wallboards with: ${nameOrPrefix}`);
    
    // Search for wallboards with the name/prefix
    await this.searchWallboard(nameOrPrefix);
    await this.waitForTimeout(5000, 'Search results loading');
    
    // Delete all matching wallboards
    let attempts = 0;
    while (attempts < 10) {
      try {
        const wallboardElement = this.locator(`:text("${nameOrPrefix}")`);
        
        if (!(await this.isVisible(wallboardElement))) {
          break; // No more wallboards to delete
        }
        
        // Click menu button and delete
        const menuButton = this.locator(`[data-cy="realtime-wallboards-item-menu-button"]:right-of(:text("${nameOrPrefix}"))`).first();
        await this.clickElement(menuButton);
        await this.clickElement(this.deleteOption);
        await this.clickElement(this.confirmationOkayButton);
        
        await this.waitForTimeout(5000, 'Wallboard deletion');
        attempts++;
        
      } catch (error) {
        console.warn(`Cleanup attempt ${attempts + 1} failed:`, error.message);
        break;
      }
    }
    
    console.log(`✅ Wallboard cleanup completed for: ${nameOrPrefix}`);
  }

  /**
   * Search for wallboard
   */
  async searchWallboard(searchTerm: string): Promise<void> {
    await this.fillField(this.searchInput, searchTerm);
    await this.page.keyboard.press('Enter');
    await this.waitForTimeout(2000, 'Search processing');
  }

  /**
   * Clear search
   */
  async clearSearch(): Promise<void> {
    await this.fillField(this.searchInput, '');
    await this.page.keyboard.press('Enter');
    await this.waitForTimeout(2000, 'Search clearing');
  }

  /**
   * Duplicate wallboard
   */
  async duplicateWallboard(originalName: string, newName: string): Promise<void> {
    console.log(`Duplicating wallboard: ${originalName} → ${newName}`);
    
    // Search for original wallboard
    await this.searchWallboard(originalName);
    
    // Click wallboard menu button
    const menuButton = this.locator(`[data-cy="realtime-wallboards-item-menu-button"]:right-of(:text("${originalName}"))`);
    await this.clickElement(menuButton);
    
    // Click duplicate option
    await this.clickElement(this.duplicateOption);
    
    // Enter new name
    await this.fillField(this.promptInput, newName);
    await this.clickElement(this.submitButton);
    
    await this.waitForTimeout(3000, 'Wallboard duplication processing');
    
    console.log(`✅ Wallboard duplicated: ${newName}`);
  }

  /**
   * Share wallboard with roles
   */
  async shareWallboard(wallboardName: string): Promise<void> {
    console.log(`Sharing wallboard: ${wallboardName}`);
    
    // Search for wallboard
    await this.searchWallboard(wallboardName);
    
    // Click wallboard menu button
    const menuButton = this.locator(`[data-cy="realtime-wallboards-item-menu-button"]:right-of(:text("${wallboardName}"))`);
    await this.clickElement(menuButton);
    
    // Click share option
    await this.clickElement(this.shareOption);
    
    // Configure sharing (select all roles)
    const allRolesCheckbox = this.locator('.all input');
    if (!(await allRolesCheckbox.isChecked())) {
      await this.clickElement(this.locator('.all'));
    }
    
    // Verify all options are selected
    const roleOptions = this.locator('mat-list-option');
    const optionCount = await roleOptions.count();
    
    for (let i = 0; i < optionCount; i++) {
      const option = roleOptions.nth(i);
      await this.expectAttribute(option, 'aria-selected', 'true');
    }
    
    // Close sharing dialog
    const closeButton = this.locator('.feather-x');
    await this.clickElement(closeButton);
    
    console.log(`✅ Wallboard sharing configured: ${wallboardName}`);
  }

  /**
   * Export wallboard
   */
  async exportWallboard(wallboardName: string): Promise<string> {
    console.log(`Exporting wallboard: ${wallboardName}`);
    
    // Search for wallboard
    await this.searchWallboard(wallboardName);
    
    // Click wallboard menu button
    const menuButton = this.locator(`[data-cy="realtime-wallboards-item-menu-button"]:right-of(:text("${wallboardName}"))`);
    await this.clickElement(menuButton);
    
    // Start download
    const [download] = await Promise.all([
      this.page.waitForEvent('download'),
      this.clickElement(this.exportOption)
    ]);
    
    const fileName = download.suggestedFilename();
    console.log(`✅ Wallboard exported: ${fileName}`);
    
    return fileName;
  }

  /**
   * Open wallboard in preview mode
   */
  async openWallboardPreview(wallboardName: string): Promise<void> {
    console.log(`Opening wallboard preview: ${wallboardName}`);
    
    // Search for wallboard
    await this.searchWallboard(wallboardName);
    
    // Click wallboard footer button
    const footerButton = this.locator('.wallboard-footer button').first();
    await this.clickElement(footerButton);
    
    // Click open option
    await this.clickElement(this.openOption);
    
    // Verify preview mode
    await this.expectUrl(/wallboard-preview/);
    await this.expectVisible(this.locator('button:has-text("Full Screen")'));
    
    console.log(`✅ Wallboard preview opened: ${wallboardName}`);
  }

  /**
   * Open wallboard in edit mode
   */
  async openWallboardEdit(wallboardName: string): Promise<void> {
    console.log(`Opening wallboard edit: ${wallboardName}`);
    
    // Search for wallboard
    await this.searchWallboard(wallboardName);
    
    // Click wallboard footer button
    const footerButton = this.locator('.wallboard-footer button').first();
    await this.clickElement(footerButton);
    
    // Click edit option
    await this.clickElement(this.editOption);
    
    // Verify edit mode
    await this.expectUrl(/wallboard/);
    await this.expectVisible(this.saveAndExitButton);
    await this.expectVisible(this.locator('[placeholder="Search Widgets"]'));
    
    console.log(`✅ Wallboard edit opened: ${wallboardName}`);
  }

  /**
   * Get template element by template type
   */
  private getTemplateElement(template: WallboardTemplate) {
    switch (template) {
      case WallboardTemplate.SINGLE_SKILL:
        return this.singleSkillTemplate;
      case WallboardTemplate.TWO_SKILLS:
        return this.twoSkillsTemplate;
      case WallboardTemplate.CUSTOM:
        return this.customTemplate;
      case WallboardTemplate.AGENT_AND_SKILL:
        return this.agentAndSkillTemplate;
      case WallboardTemplate.CALLBACKS:
        return this.callbacksTemplate;
      case WallboardTemplate.CALLS_AND_WEB_CHATS:
        return this.callsAndWebChatsTemplate;
      case WallboardTemplate.SLA:
        return this.slaTemplate;
      case WallboardTemplate.DAILY_SLA_VOICE:
        return this.dailySlaVoiceTemplate;
      case WallboardTemplate.FOUR_SKILLS:
        return this.fourSkillsTemplate;
      default:
        throw new Error(`Unsupported wallboard template: ${template}`);
    }
  }

  /**
   * Complete wallboard creation workflow
   */
  async createCompleteWallboard(options: CreateWallboardOptions): Promise<void> {
    console.log('Executing complete wallboard creation workflow...');
    
    // Cleanup existing wallboards with same name
    await this.cleanupWallboards(options.name);
    
    // Create wallboard from template
    await this.createWallboardFromTemplate(options);
    
    // Preview wallboard if preview elements provided
    if (options.previewElements && options.previewElements.length > 0) {
      await this.previewWallboard(options.previewElements);
    }
    
    // Save wallboard
    await this.saveWallboard();
    
    console.log(`✅ Complete wallboard creation finished: ${options.name}`);
  }

  /**
   * Execute wallboard options workflow (open, edit, duplicate, share, export)
   */
  async executeWallboardOptionsWorkflow(wallboardName: string): Promise<string> {
    console.log(`Executing wallboard options workflow for: ${wallboardName}`);
    
    // 1. Open wallboard in preview
    await this.openWallboardPreview(wallboardName);
    
    // Navigate back
    const backButton = this.locator('.feather-arrow-left');
    await this.clickElement(backButton);
    
    // 2. Open wallboard in edit mode
    await this.waitForTimeout(5000);
    await this.openWallboardEdit(wallboardName);
    
    // Navigate back
    await this.clickElement(backButton);
    
    // 3. Duplicate wallboard
    await this.waitForTimeout(5000);
    const duplicateName = `Duplicate ${Date.now().toString().slice(-4)}`;
    await this.duplicateWallboard(wallboardName, duplicateName);
    
    // 4. Verify duplicate exists and delete it
    await this.searchWallboard(duplicateName);
    const duplicateFooter = this.locator(`.wallboard-footer:has-text("${duplicateName}")`);
    await this.expectVisible(duplicateFooter);
    
    // Delete duplicate
    const duplicateMenuButton = this.locator(`.wallboard-footer:has-text("${duplicateName}") button`);
    await this.clickElement(duplicateMenuButton);
    await this.clickElement(this.deleteOption);
    await this.clickElement(this.confirmationOkayButton);
    
    // 5. Share wallboard
    await this.clearSearch();
    await this.shareWallboard(wallboardName);
    
    // 6. Export wallboard
    const exportedFileName = await this.exportWallboard(wallboardName);
    
    console.log(`✅ Wallboard options workflow completed for: ${wallboardName}`);
    return exportedFileName;
  }

  /**
   * Verify wallboard exists
   */
  async verifyWallboardExists(wallboardName: string): Promise<void> {
    await this.searchWallboard(wallboardName);
    const wallboardElement = this.locator(`:text("${wallboardName}")`);
    await this.expectVisible(wallboardElement);
    console.log(`✅ Wallboard verified: ${wallboardName}`);
  }

  /**
   * Generate timestamped wallboard name
   */
  static generateWallboardName(prefix: string): string {
    const timestamp = Date.now().toString().slice(-4);
    return `${prefix} ${timestamp}`;
  }
}

// ============================================================================
// SUPPORTING ENUMS AND INTERFACES
// ============================================================================

export enum WallboardTemplate {
  SINGLE_SKILL = 'Single Skill',
  TWO_SKILLS = 'Two Skills',
  CUSTOM = 'Custom',
  AGENT_AND_SKILL = 'Agent and Skill',
  CALLBACKS = 'Callbacks',
  CALLS_AND_WEB_CHATS = 'Calls and Web Chats',
  SLA = 'SLA',
  DAILY_SLA_VOICE = 'Daily SLA Voice',
  FOUR_SKILLS = '4 Skills'
}

export interface CreateWallboardOptions {
  name: string;
  template: WallboardTemplate;
  configureSkills?: boolean;
  configureAgents?: boolean;
  previewElements?: string[];
}

export interface WallboardDetails {
  name: string;
  template: WallboardTemplate;
  createdTime: Date;
  widgetCount?: number;
  isFavorite?: boolean;
}

