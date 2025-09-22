import { Page } from '@playwright/test';
import { BasePage } from '../base-page';
import { LoopsManagementPage } from './loops-management-page';

/**
 * Realtime Displays Page - Main hub for realtime monitoring functionality
 * Provides access to loops, wallboards, and supervisor view functionality
 */
export class RealtimeDisplaysPage extends BasePage {
  
  // Main navigation elements
  private readonly realtimeDisplaysMenu = this.getByDataCy('sidenav-menu-REALTIME_DISPLAYS');
  private readonly realtimeDisplaysTitle = this.getByText('Realtime Displays');
  
  // Tab navigation elements  
  private readonly loopsTab = this.getByRole('tab', { name: 'Loops' });
  private readonly wallboardsTab = this.getByRole('tab', { name: 'Wallboards' });
  private readonly supervisorViewTab = this.getByRole('tab', { name: 'Supervisor View' });
  
  // Content area elements
  private readonly contentArea = this.locator('.content-area, .main-content');
  private readonly tabContent = this.locator('.tab-content, mat-tab-group');
  
  constructor(page: Page, baseUrl?: string) {
    super(page, baseUrl);
  }

  async verifyPageLoaded(): Promise<void> {
    await this.expectVisible(this.realtimeDisplaysMenu);
  }

  /**
   * Navigate to Realtime Displays main page
   */
  async navigateToRealtimeDisplays(): Promise<void> {
    console.log('Navigating to Realtime Displays...');
    
    // Click Realtime Displays menu item
    await this.clickElement(this.realtimeDisplaysMenu);
    
    // Wait for page to load
    await this.waitForPageLoad();
    
    console.log('✅ Realtime Displays page loaded');
  }

  /**
   * Navigate to Loops management
   */
  async navigateToLoops(): Promise<LoopsManagementPage> {
    console.log('Navigating to Loops from Realtime Displays...');
    
    // Ensure we're on realtime displays
    await this.navigateToRealtimeDisplays();
    
    // Click Loops tab
    await this.expectVisible(this.loopsTab);
    await this.clickElement(this.loopsTab);
    
    // Return loops management page
    const loopsPage = new LoopsManagementPage(this.page, this.baseUrl);
    await loopsPage.verifyPageLoaded();
    
    console.log('✅ Loops management page loaded');
    return loopsPage;
  }

  /**
   * Navigate to Wallboards
   */
  async navigateToWallboards(): Promise<void> {
    console.log('Navigating to Wallboards...');
    
    await this.navigateToRealtimeDisplays();
    await this.clickElement(this.wallboardsTab);
    
    console.log('✅ Wallboards page loaded');
  }

  /**
   * Navigate to Supervisor View
   */
  async navigateToSupervisorView(): Promise<void> {
    console.log('Navigating to Supervisor View...');
    
    await this.navigateToRealtimeDisplays();
    await this.clickElement(this.supervisorViewTab);
    
    console.log('✅ Supervisor View page loaded');
  }

  /**
   * Verify realtime displays tabs are available
   */
  async verifyRealtimeDisplaysTabs(): Promise<void> {
    await this.expectVisible(this.loopsTab);
    await this.expectVisible(this.wallboardsTab);
    await this.expectVisible(this.supervisorViewTab);
    
    console.log('✅ All realtime displays tabs verified');
  }

  /**
   * Get current active tab
   */
  async getCurrentActiveTab(): Promise<string> {
    try {
      const activeTabs = [
        { tab: this.loopsTab, name: 'Loops' },
        { tab: this.wallboardsTab, name: 'Wallboards' },
        { tab: this.supervisorViewTab, name: 'Supervisor View' }
      ];
      
      for (const tabInfo of activeTabs) {
        const tabClass = await tabInfo.tab.getAttribute('class');
        if (tabClass && tabClass.includes('active')) {
          return tabInfo.name;
        }
      }
      
      return 'unknown';
    } catch {
      return 'unknown';
    }
  }

  /**
   * Hover over realtime displays menu for quick access
   */
  async hoverRealtimeDisplaysMenu(): Promise<void> {
    await this.hoverElement(this.realtimeDisplaysMenu);
    await this.waitForTimeout(500, 'Menu hover activation');
  }

  /**
   * Access loops directly through hover navigation
   */
  async accessLoopsDirectly(): Promise<LoopsManagementPage> {
    console.log('Accessing Loops directly through hover navigation...');
    
    // Hover over realtime displays menu
    await this.hoverRealtimeDisplaysMenu();
    
    // Click Loops option
    const loopsOption = this.getByText('Loops');
    await this.expectVisible(loopsOption);
    await this.clickElement(loopsOption);
    
    // Return loops management page
    const loopsPage = new LoopsManagementPage(this.page, this.baseUrl);
    await loopsPage.verifyPageLoaded();
    
    console.log('✅ Loops accessed directly');
    return loopsPage;
  }
}

