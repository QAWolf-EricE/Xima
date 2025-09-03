import { Page } from '@playwright/test';
import { BasePage } from '../base-page';

/**
 * Reports Home Page - Main reports landing page
 */
export class ReportsHomePage extends BasePage {
  
  private readonly reportsTitle = this.locator('[translationset="HOME_TITLE"]');
  private readonly cradleToGraveTab = this.getByDataCy('reports-c2g-component-tab-ctog');
  
  constructor(page: Page, baseUrl?: string) {
    super(page, baseUrl);
  }

  async verifyPageLoaded(): Promise<void> {
    await this.expectVisible(this.reportsTitle);
    await this.expectText(this.reportsTitle, 'Reports');
    await this.expectVisible(this.cradleToGraveTab);
  }
}
