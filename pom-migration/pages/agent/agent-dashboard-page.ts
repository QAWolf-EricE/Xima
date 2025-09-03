import { Page } from '@playwright/test';
import { BasePage } from '../base-page';
import { AgentStatus, ChannelType } from '../../shared/types/core';
import { ChannelStatePage } from './channel-state-page';
import { ActiveMediaPage } from './active-media-page';
import { SkillsManagementPage } from './skills-management-page';

/**
 * Agent Dashboard - Main landing page for agent users
 * Provides agent-specific functionality including status management, channels, and active media
 */
export class AgentDashboardPage extends BasePage {
  
  // Main dashboard elements
  private readonly agentName = this.locator('.avatar-name-container, .name');
  private readonly channelStatesTitle = this.getByText('Channel States');
  private readonly activeMediaTitle = this.getByText('Active Media');
  
  // Status and menu controls
  private readonly agentStatusButton = this.getByDataCy('agent-status-menu-button');
  private readonly statusDropdown = this.locator('.status-menu, .agent-status-dropdown');
  private readonly logoutLink = this.getByDataCy('agent-status-logout-link');
  
  // Channel state indicators
  private readonly voiceChannelIcon = this.getByDataCy('channel-state-channel-VOICE-icon');
  private readonly chatChannelIcon = this.getByDataCy('channel-state-channel-CHAT-icon');
  private readonly emailChannelIcon = this.getByDataCy('channel-state-channel-EMAIL-icon');
  private readonly channelStateLabel = this.getByDataCy('channel-state-label');
  
  // Quick navigation elements
  private readonly manageSkillsButton = this.getByDataCy('channel-state-manage-skills');
  private readonly dndStatusContainer = this.locator('[class="dnd-status-container"]');
  private readonly dndStatusText = this.locator('[class="dnd-status-text"]');
  
  // Active media elements
  private readonly activeChatEmail = this.getByDataCy('active-media-chat-email');
  private readonly activeVoiceCall = this.locator('xima-active-media-tile');
  
  constructor(page: Page, baseUrl?: string) {
    super(page, baseUrl);
  }

  /**
   * Verify the agent dashboard has loaded correctly
   */
  async verifyDashboardLoaded(): Promise<void> {
    await this.expectUrl(/\/ccagent/);
    await this.expectVisible(this.agentName, 30000);
    await this.expectVisible(this.channelStatesTitle);
    await this.expectVisible(this.activeMediaTitle);
    
    console.log('Agent dashboard loaded successfully');
  }

  /**
   * Get the agent name displayed on dashboard
   */
  async getAgentName(): Promise<string> {
    return await this.getText(this.agentName);
  }

  /**
   * Verify specific agent name is displayed
   */
  async verifyAgentName(expectedName: string): Promise<void> {
    await this.expectText(this.agentName, expectedName);
  }

  /**
   * Get current agent status
   */
  async getAgentStatus(): Promise<string> {
    return await this.getText(this.dndStatusText);
  }

  /**
   * Set agent status
   */
  async setStatus(status: AgentStatus): Promise<void> {
    await this.clickElement(this.dndStatusContainer.locator('button'));
    await this.waitForVisible(this.locator('.status-menu'));
    
    const statusOption = this.getByRole('menuitem', { name: status });
    await this.clickElement(statusOption);
    
    // Wait for status to update
    await this.waitForTimeout(2000, 'Status update');
    
    console.log(`Agent status set to: ${status}`);
  }

  /**
   * Set agent to Ready status
   */
  async setReady(): Promise<void> {
    const currentStatus = await this.getAgentStatus();
    if (currentStatus !== AgentStatus.READY) {
      await this.setStatus(AgentStatus.READY);
    }
  }

  /**
   * Check if specific channel is enabled
   */
  async isChannelEnabled(channel: ChannelType): Promise<boolean> {
    const channelIcon = this.getChannelIcon(channel);
    
    try {
      // Check if channel has "ready" class or green color
      const hasReadyClass = await channelIcon.locator('.ready').count() > 0;
      if (hasReadyClass) return true;
      
      // Check CSS color for green (RGB values for enabled state)
      const color = await channelIcon.evaluate(el => getComputedStyle(el).color);
      return color.includes('rgb(49, 180, 164)') || color.includes('green');
      
    } catch {
      return false;
    }
  }

  /**
   * Enable/disable specific channel
   */
  async toggleChannel(channel: ChannelType, enabled: boolean): Promise<void> {
    const isCurrentlyEnabled = await this.isChannelEnabled(channel);
    
    if (isCurrentlyEnabled !== enabled) {
      const channelIcon = this.getChannelIcon(channel);
      await this.clickElement(channelIcon, { force: true });
      
      // Handle confirmation dialog if it appears
      try {
        await this.getByRole('button', { name: 'Confirm' }).click({ timeout: 5000 });
      } catch {
        // No confirmation needed
      }
      
      await this.waitForTimeout(2000, 'Channel toggle update');
    }
    
    console.log(`${channel} channel ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Enable specific channel
   */
  async enableChannel(channel: ChannelType): Promise<void> {
    await this.toggleChannel(channel, true);
  }

  /**
   * Disable specific channel
   */
  async disableChannel(channel: ChannelType): Promise<void> {
    await this.toggleChannel(channel, false);
  }

  /**
   * Navigate to Skills Management
   */
  async navigateToSkillsManagement(): Promise<SkillsManagementPage> {
    await this.clickElement(this.manageSkillsButton);
    
    const skillsPage = new SkillsManagementPage(this.page, this.baseUrl);
    await skillsPage.verifyPageLoaded();
    
    return skillsPage;
  }

  /**
   * Enable specific skill
   */
  async enableSkill(skillName: string): Promise<void> {
    const skillsPage = await this.navigateToSkillsManagement();
    await skillsPage.enableSkill(skillName);
    await skillsPage.close();
  }

  /**
   * Navigate to Channel State management
   */
  async navigateToChannelState(): Promise<ChannelStatePage> {
    const channelStatePage = new ChannelStatePage(this.page, this.baseUrl);
    await channelStatePage.verifyPageLoaded();
    
    return channelStatePage;
  }

  /**
   * Navigate to Active Media
   */
  async navigateToActiveMedia(): Promise<ActiveMediaPage> {
    const activeMediaPage = new ActiveMediaPage(this.page, this.baseUrl);
    await activeMediaPage.verifyPageLoaded();
    
    return activeMediaPage;
  }

  /**
   * Check if there are active chats
   */
  async hasActiveChats(): Promise<boolean> {
    const chatCount = await this.getCount(this.activeChatEmail);
    return chatCount > 0;
  }

  /**
   * Get number of active chats
   */
  async getActiveChatCount(): Promise<number> {
    return await this.getCount(this.activeChatEmail);
  }

  /**
   * Check if there are active calls
   */
  async hasActiveCalls(): Promise<boolean> {
    const callCount = await this.getCount(this.activeVoiceCall);
    return callCount > 0;
  }

  /**
   * Handle incoming call offer
   */
  async expectIncomingCall(): Promise<void> {
    const callOffer = this.getByText('Call Offer');
    await this.expectVisible(callOffer, 30000);
  }

  /**
   * Answer incoming call
   */
  async answerCall(): Promise<void> {
    const answerButton = this.getByDataCy('alert-call-offer-accept');
    await this.clickElement(answerButton);
    await this.waitForTimeout(2000, 'Call connection');
  }

  /**
   * Expect call to end
   */
  async expectCallEnded(): Promise<void> {
    const callOffer = this.getByText('Call Offer');
    await this.expectHidden(callOffer, 10000);
  }

  /**
   * Handle incoming chat offer
   */
  async expectIncomingChat(): Promise<void> {
    const chatOffer = this.getByText('Chat Offer');
    await this.expectVisible(chatOffer, 30000);
  }

  /**
   * Accept incoming chat
   */
  async acceptChat(): Promise<void> {
    const acceptButton = this.getByDataCy('alert-chat-offer-accept');
    await this.clickElement(acceptButton);
    await this.waitForTimeout(2000, 'Chat connection');
  }

  /**
   * End active chat
   */
  async endChat(): Promise<void> {
    if (await this.hasActiveChats()) {
      await this.clickElement(this.activeChatEmail.first());
      
      const endChatButton = this.getByDataCy('end-chat');
      await this.clickElement(endChatButton);
      
      const finishButton = this.getByDataCy('call-details-finish-anchor');
      await this.clickElement(finishButton);
      
      await this.waitForTimeout(2000, 'Chat cleanup');
    }
  }

  /**
   * Clean up all active media (chats, calls, etc.)
   */
  async cleanupActiveMedia(): Promise<void> {
    // Clean up active chats
    let attempts = 0;
    while ((await this.hasActiveChats()) && attempts < 5) {
      await this.endChat();
      attempts++;
    }

    // Handle any remaining media cleanup
    const activeMediaTiles = this.locator('xima-active-media-tile');
    const tileCount = await activeMediaTiles.count();
    
    for (let i = 0; i < Math.min(tileCount, 5); i++) {
      try {
        await activeMediaTiles.nth(i).click();
        await this.getByRole('button', { name: 'End Chat' }).click({ timeout: 5000 });
        await this.getByRole('button', { name: 'Close' }).click();
      } catch {
        // Continue with next tile
      }
    }
  }

  /**
   * Logout from agent dashboard
   */
  async logout(): Promise<void> {
    await this.clickElement(this.agentStatusButton);
    await this.expectVisible(this.logoutLink);
    await this.clickElement(this.logoutLink);
    
    // Wait for redirect to login page
    await this.expectUrl(/login|\/$/);
    console.log('Successfully logged out from agent dashboard');
  }

  /**
   * Get channel icon locator by type
   */
  private getChannelIcon(channel: ChannelType) {
    switch (channel) {
      case ChannelType.VOICE:
        return this.voiceChannelIcon;
      case ChannelType.CHAT:
        return this.chatChannelIcon;
      case ChannelType.EMAIL:
        return this.emailChannelIcon;
      default:
        throw new Error(`Unsupported channel type: ${channel}`);
    }
  }

  /**
   * Verify agent dashboard elements are present
   */
  async verifyDashboardElements(): Promise<void> {
    await this.expectVisible(this.channelStatesTitle);
    await this.expectVisible(this.activeMediaTitle);
    await this.expectVisible(this.agentStatusButton);
  }

  /**
   * Get current channel states summary
   */
  async getChannelStatesSummary(): Promise<Record<ChannelType, boolean>> {
    return {
      [ChannelType.VOICE]: await this.isChannelEnabled(ChannelType.VOICE),
      [ChannelType.CHAT]: await this.isChannelEnabled(ChannelType.CHAT),
      [ChannelType.EMAIL]: await this.isChannelEnabled(ChannelType.EMAIL)
    };
  }
}
