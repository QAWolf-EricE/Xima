import { Page } from '@playwright/test';
import { BasePage } from '../base-page';

/**
 * Skills Management Page - Modal/dialog for managing agent skills
 */
export class SkillsManagementPage extends BasePage {
  
  private readonly skillsDialog = this.locator('xima-dialog-header:has-text("Manage Skills")');
  private readonly allSkillsOffButton = this.getByText('All Skills Off');
  private readonly closeButton = this.locator('xima-dialog-header button[data-unit="close"]');
  
  constructor(page: Page, baseUrl?: string) {
    super(page, baseUrl);
  }

  async verifyPageLoaded(): Promise<void> {
    await this.expectVisible(this.skillsDialog);
  }

  async enableSkill(skillName: string): Promise<void> {
    // Turn off all skills first
    await this.clickElement(this.allSkillsOffButton);
    await this.waitForTimeout(1000);
    
    // Enable specific skill
    const skillToggle = this.locator(`[class*="skill"]:has-text("Skill ${skillName}") input ~ span`);
    await this.clickElement(skillToggle);
    await this.waitForTimeout(1000);
  }

  async close(): Promise<void> {
    await this.clickElement(this.closeButton);
  }
}
