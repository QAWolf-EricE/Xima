import { Page, Locator, expect } from '@playwright/test';
import { BrowserOptions } from '../shared/types/core';

/**
 * Base class for all Page Object Models
 * Provides common functionality and enforces consistent patterns
 */
export abstract class BasePage {
  protected readonly page: Page;
  protected readonly baseUrl: string;

  constructor(page: Page, baseUrl?: string) {
    this.page = page;
    this.baseUrl = baseUrl || process.env.DEFAULT_URL || '';
  }

  /**
   * Navigate to a specific URL path
   * @param path - The path to navigate to (relative to baseUrl)
   * @param waitForLoad - Whether to wait for page to load completely
   */
  async navigateTo(path: string = '', waitForLoad: boolean = true): Promise<void> {
    const url = this.buildUrl(path);
    await this.page.goto(url);
    
    if (waitForLoad) {
      await this.waitForPageLoad();
    }
  }

  /**
   * Build full URL from path
   */
  protected buildUrl(path: string): string {
    const cleanBaseUrl = this.baseUrl.replace(/\/$/, '');
    const cleanPath = path.replace(/^\//, '');
    return cleanPath ? `${cleanBaseUrl}/${cleanPath}` : cleanBaseUrl;
  }

  /**
   * Wait for page to be fully loaded
   */
  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {
      // Ignore network idle timeout for pages with persistent connections
      console.log('Network idle timeout reached, continuing...');
    });
  }

  /**
   * Wait for a specific timeout with logging
   */
  async waitForTimeout(milliseconds: number, reason?: string): Promise<void> {
    if (reason) {
      console.log(`Waiting ${milliseconds}ms: ${reason}`);
    }
    await this.page.waitForTimeout(milliseconds);
  }

  /**
   * Get current page URL
   */
  getCurrentUrl(): string {
    return this.page.url();
  }

  /**
   * Get page title
   */
  async getTitle(): string {
    return await this.page.title();
  }

  /**
   * Bring this page to front (useful for multi-page scenarios)
   */
  async bringToFront(): Promise<void> {
    await this.page.bringToFront();
  }

  /**
   * Take screenshot for debugging
   */
  async takeScreenshot(name?: string): Promise<Buffer> {
    const fileName = name || `${this.constructor.name}_${Date.now()}`;
    return await this.page.screenshot({ 
      fullPage: true, 
      path: `screenshots/${fileName}.png` 
    });
  }

  /**
   * Check if page is at expected URL pattern
   */
  async expectUrl(urlPattern: string | RegExp): Promise<void> {
    await expect(this.page).toHaveURL(urlPattern);
  }

  /**
   * Reload current page
   */
  async reload(): Promise<void> {
    await this.page.reload();
    await this.waitForPageLoad();
  }

  // ============================================================================
  // ELEMENT INTERACTION HELPERS
  // ============================================================================

  /**
   * Find element by data-cy attribute (preferred selector method)
   */
  protected getByDataCy(value: string): Locator {
    return this.page.locator(`[data-cy="${value}"]`);
  }

  /**
   * Find element by role with optional name
   */
  protected getByRole(role: string, options?: { name?: string; exact?: boolean }): Locator {
    return this.page.getByRole(role as any, options);
  }

  /**
   * Find element by text content
   */
  protected getByText(text: string, exact: boolean = false): Locator {
    return this.page.getByText(text, { exact });
  }

  /**
   * Find element by placeholder text
   */
  protected getByPlaceholder(text: string): Locator {
    return this.page.getByPlaceholder(text);
  }

  /**
   * Generic locator method
   */
  protected locator(selector: string): Locator {
    return this.page.locator(selector);
  }

  /**
   * Fill input field with value
   */
  protected async fillField(locator: Locator, value: string, options?: { clear?: boolean }): Promise<void> {
    if (options?.clear) {
      await locator.clear();
    }
    await locator.fill(value);
  }

  /**
   * Click element with optional options
   */
  protected async clickElement(
    locator: Locator, 
    options?: { force?: boolean; delay?: number; timeout?: number }
  ): Promise<void> {
    await locator.click(options);
  }

  /**
   * Wait for element to be visible
   */
  protected async waitForVisible(
    locator: Locator, 
    timeout: number = 10000
  ): Promise<void> {
    await locator.waitFor({ state: 'visible', timeout });
  }

  /**
   * Wait for element to be hidden
   */
  protected async waitForHidden(
    locator: Locator, 
    timeout: number = 10000
  ): Promise<void> {
    await locator.waitFor({ state: 'hidden', timeout });
  }

  /**
   * Check if element exists and is visible
   */
  protected async isVisible(locator: Locator): Promise<boolean> {
    try {
      await locator.waitFor({ state: 'visible', timeout: 1000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get element count
   */
  protected async getCount(locator: Locator): Promise<number> {
    return await locator.count();
  }

  /**
   * Get element text content
   */
  protected async getText(locator: Locator): Promise<string> {
    return await locator.textContent() || '';
  }

  /**
   * Get element inner text
   */
  protected async getInnerText(locator: Locator): Promise<string> {
    return await locator.innerText();
  }

  /**
   * Select option from dropdown
   */
  protected async selectOption(
    locator: Locator, 
    option: string | { value?: string; label?: string; index?: number }
  ): Promise<void> {
    if (typeof option === 'string') {
      await locator.selectOption({ label: option });
    } else if (option.value) {
      await locator.selectOption({ value: option.value });
    } else if (option.label) {
      await locator.selectOption({ label: option.label });
    } else if (option.index !== undefined) {
      await locator.selectOption({ index: option.index });
    }
  }

  /**
   * Check/uncheck checkbox
   */
  protected async setCheckbox(locator: Locator, checked: boolean): Promise<void> {
    if (checked) {
      await locator.check();
    } else {
      await locator.uncheck();
    }
  }

  /**
   * Hover over element
   */
  protected async hoverElement(locator: Locator): Promise<void> {
    await locator.hover();
  }

  // ============================================================================
  // ASSERTION HELPERS  
  // ============================================================================

  /**
   * Expect element to be visible
   */
  protected async expectVisible(locator: Locator, timeout: number = 10000): Promise<void> {
    await expect(locator).toBeVisible({ timeout });
  }

  /**
   * Expect element to be hidden
   */
  protected async expectHidden(locator: Locator, timeout: number = 10000): Promise<void> {
    await expect(locator).not.toBeVisible({ timeout });
  }

  /**
   * Expect element to have specific text
   */
  protected async expectText(locator: Locator, text: string, timeout: number = 10000): Promise<void> {
    await expect(locator).toHaveText(text, { timeout });
  }

  /**
   * Expect element to contain text
   */
  protected async expectContainsText(locator: Locator, text: string, timeout: number = 10000): Promise<void> {
    await expect(locator).toContainText(text, { timeout });
  }

  /**
   * Expect element to be enabled
   */
  protected async expectEnabled(locator: Locator, timeout: number = 10000): Promise<void> {
    await expect(locator).toBeEnabled({ timeout });
  }

  /**
   * Expect element to be disabled
   */
  protected async expectDisabled(locator: Locator, timeout: number = 10000): Promise<void> {
    await expect(locator).toBeDisabled({ timeout });
  }

  /**
   * Expect checkbox to be checked
   */
  protected async expectChecked(locator: Locator, timeout: number = 10000): Promise<void> {
    await expect(locator).toBeChecked({ timeout });
  }

  /**
   * Expect input to have specific value
   */
  protected async expectValue(locator: Locator, value: string, timeout: number = 10000): Promise<void> {
    await expect(locator).toHaveValue(value, { timeout });
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Execute JavaScript in the page context
   */
  protected async evaluate<T = any>(pageFunction: Function, arg?: any): Promise<T> {
    return await this.page.evaluate(pageFunction, arg);
  }

  /**
   * Upload file to input element
   */
  protected async uploadFile(locator: Locator, filePath: string | string[]): Promise<void> {
    await locator.setInputFiles(filePath);
  }

  /**
   * Download file from link
   */
  protected async downloadFile(locator: Locator): Promise<string> {
    const [download] = await Promise.all([
      this.page.waitForEvent('download'),
      locator.click()
    ]);
    const path = await download.path();
    return path || '';
  }

  /**
   * Handle dialog (alert/confirm/prompt)
   */
  protected async handleDialog(accept: boolean = true, promptText?: string): Promise<void> {
    this.page.on('dialog', async dialog => {
      if (dialog.type() === 'prompt' && promptText) {
        await dialog.accept(promptText);
      } else if (accept) {
        await dialog.accept();
      } else {
        await dialog.dismiss();
      }
    });
  }

  /**
   * Wait for new page to open (useful for popup handling)
   */
  protected async waitForNewPage(): Promise<Page> {
    const [newPage] = await Promise.all([
      this.page.context().waitForEvent('page'),
    ]);
    return newPage;
  }

  /**
   * Close page
   */
  async close(): Promise<void> {
    await this.page.close();
  }
}
