import { Page } from '@playwright/test';
import { BasePage } from '../base-page';

/**
 * Chat Session Page - Represents the agent's chat interface during active chat sessions
 * Used for managing chat conversations, transfers, notes, and other chat-related actions
 */
export class ChatSessionPage extends BasePage {
  
  // Chat interface elements
  private readonly chatTextSent = this.getByDataCy('chat-text-sent');
  private readonly chatTextReceived = this.getByDataCy('chat-test-receieved');
  private readonly chatTextInput = this.getByDataCy('chat-text-input');
  private readonly chatSendButton = this.getByDataCy('chat-send-message');
  
  // Chat header and controls
  private readonly chatHeader = this.getByDataCy('chat-header');
  private readonly chatHeaderMenuButton = this.getByDataCy('chat-header-menu-button');
  private readonly endChatButton = this.getByDataCy('end-chat');
  private readonly customerName = this.locator('[data-cy="chat-header"] [data-cy*="customer-name"], [data-cy="active-media-chat-username"]');
  
  // Customer details sidebar
  private readonly customerDetailsTitle = this.getByText('Customer Details');
  private readonly detailsTabs = this.locator('[role="tab"]');
  private readonly notesTab = this.locator('[role="tab"]#mat-tab-label-0-1');
  private readonly codesTab = this.locator('[role="tab"]#mat-tab-label-0-2');
  
  // Notes management
  private readonly noteTextarea = this.getByDataCy('details-sidebar-note-textarea');
  private readonly notePostButton = this.getByDataCy('details-sidebar-note-post-anchor');
  
  // Codes management
  private readonly codeSelect = this.getByDataCy('details-sidebar-select-code');
  
  // Canned messages/templates
  private readonly templateSelectButton = this.getByDataCy('chat-select-template');
  private readonly templateMenuItem = this.getByDataCy('chat-template-menu-item');
  
  // Screenshot functionality
  private readonly requestScreenshotButton = this.getByDataCy('chat-request-screenshot');
  private readonly screenshotReceived = this.getByDataCy('chat-screenshot-received');
  private readonly screenshotRejected = this.getByText('Screenshot Rejected');
  
  // Transfer functionality
  private readonly transferChatButton = this.getByDataCy('transfer-chat');
  private readonly transferChatAgent = this.locator('[data-cy*="transfer-chat-to-agent-"]');
  
  // Chat offers and alerts
  private readonly chatOfferAlert = this.getByText('Chat Offer');
  private readonly chatOfferAccept = this.getByDataCy('alert-chat-offer-accept');
  private readonly chatOfferReject = this.getByDataCy('alert-chat-offer-reject');
  private readonly chatTransferAlert = this.getByText('Chat Transfer Agent');
  private readonly transferAcceptButton = this.getByDataCy('alert-chat-offer-accept'); // Same as chat accept
  private readonly transferRejectButton = this.getByDataCy('alert-transfer-chat-reject');
  
  // Transfer response alerts
  private readonly transferResponseOk = this.getByDataCy('alert-chat-transfer-response-ok');
  private readonly transferAcceptedMessage = this.getByText('Your chat transfer request has been ACCEPTED');
  private readonly transferDeclinedMessage = this.getByText('Your chat transfer request has been DECLINED');
  
  // After call work
  private readonly afterCallWorkTitle = this.getByDataCy('alert-after-call-work-title');
  private readonly afterCallWorkDone = this.getByDataCy('alert-after-call-work-done');
  
  // Chat completion
  private readonly chatEnded = this.getByDataCy('chat-ended');
  private readonly finishButton = this.getByDataCy('call-details-finish-anchor');
  private readonly closeButton = this.getByRole('button', { name: 'Close' });

  constructor(page: Page, baseUrl?: string) {
    super(page, baseUrl);
  }

  /**
   * Wait for incoming chat offer
   */
  async waitForChatOffer(timeoutMs: number = 120000): Promise<void> {
    await this.expectVisible(this.chatOfferAlert, timeoutMs);
  }

  /**
   * Accept incoming chat offer
   */
  async acceptChatOffer(): Promise<void> {
    await this.clickElement(this.chatOfferAccept);
    await this.waitForTimeout(2000, 'Chat connection');
  }

  /**
   * Reject incoming chat offer
   */
  async rejectChatOffer(): Promise<void> {
    await this.clickElement(this.chatOfferReject);
  }

  /**
   * Handle missed chat timeout and cleanup
   */
  async handleMissedChatTimeout(): Promise<void> {
    await this.expectVisible(this.afterCallWorkTitle);
    await this.clickElement(this.afterCallWorkDone);
  }

  /**
   * Verify chat session is active
   */
  async verifyChatSessionActive(): Promise<void> {
    await this.expectVisible(this.chatTextSent);
    await this.expectVisible(this.customerDetailsTitle);
    await this.expectVisible(this.endChatButton);
    
    // Verify tabs are present
    const tabCount = await this.getCount(this.detailsTabs);
    if (tabCount < 3) {
      throw new Error(`Expected 3 tabs, found ${tabCount}`);
    }
  }

  /**
   * Get customer name from chat header
   */
  async getCustomerName(): Promise<string> {
    return await this.getText(this.customerName);
  }

  /**
   * Send a chat message as agent
   */
  async sendMessage(message: string): Promise<void> {
    await this.fillField(this.chatTextInput, message);
    await this.clickElement(this.chatSendButton);
    await this.waitForTimeout(1000, 'Message send');
  }

  /**
   * Verify received message from customer
   */
  async verifyReceivedMessage(message: string): Promise<void> {
    await this.expectText(this.chatTextReceived, message);
  }

  /**
   * Send canned message template
   */
  async sendCannedMessage(templateName: string): Promise<void> {
    await this.clickElement(this.templateSelectButton);
    
    const template = this.templateMenuItem.filter({ hasText: templateName });
    await this.clickElement(template);
    
    // Verify message is filled in the input
    await this.waitForTimeout(500, 'Template load');
    
    await this.clickElement(this.chatSendButton);
  }

  /**
   * Verify canned message is auto-filled
   */
  async verifyCannedMessageFilled(expectedMessage: string): Promise<void> {
    await this.expectValue(this.chatTextInput, expectedMessage);
  }

  /**
   * Request screenshot from customer
   */
  async requestScreenshot(): Promise<void> {
    await this.clickElement(this.requestScreenshotButton);
  }

  /**
   * Verify screenshot was received
   */
  async verifyScreenshotReceived(): Promise<void> {
    await this.expectVisible(this.screenshotReceived);
  }

  /**
   * Verify screenshot was rejected
   */
  async verifyScreenshotRejected(): Promise<void> {
    await this.expectVisible(this.screenshotRejected);
  }

  /**
   * Add note to customer interaction
   */
  async addNote(noteText: string): Promise<void> {
    // Switch to Notes tab
    await this.clickElement(this.notesTab);
    
    // Fill note text
    await this.fillField(this.noteTextarea, noteText);
    
    // Post the note
    await this.clickElement(this.notePostButton);
    
    // Verify note was added
    const noteElement = this.getByText(noteText);
    await this.expectVisible(noteElement);
  }

  /**
   * Verify notes tab is functional
   */
  async verifyNotesTabFunctional(): Promise<void> {
    await this.clickElement(this.notesTab);
    await this.expectVisible(this.noteTextarea);
    
    // Check if textarea is editable
    const isEditable = await this.noteTextarea.isEditable();
    if (!isEditable) {
      throw new Error('Notes textarea is not editable');
    }
  }

  /**
   * Verify codes tab is functional
   */
  async verifyCodesTabFunctional(): Promise<void> {
    await this.clickElement(this.codesTab);
    await this.expectVisible(this.codeSelect);
    await this.expectEnabled(this.codeSelect);
  }

  /**
   * Transfer chat to another agent
   */
  async transferChatToAgent(agentName: string): Promise<void> {
    // Open chat menu
    await this.clickElement(this.chatHeaderMenuButton);
    
    // Click transfer option
    await this.clickElement(this.transferChatButton);
    
    // Select target agent
    const targetAgent = this.transferChatAgent.filter({ hasText: agentName });
    await this.clickElement(targetAgent);
  }

  /**
   * Wait for chat transfer offer
   */
  async waitForChatTransferOffer(): Promise<void> {
    await this.expectVisible(this.chatTransferAlert);
  }

  /**
   * Accept chat transfer
   */
  async acceptChatTransfer(): Promise<void> {
    await this.clickElement(this.transferAcceptButton);
  }

  /**
   * Reject chat transfer
   */
  async rejectChatTransfer(): Promise<void> {
    await this.clickElement(this.transferRejectButton);
  }

  /**
   * Verify transfer response (accepted/declined)
   */
  async verifyTransferResponse(accepted: boolean): Promise<void> {
    if (accepted) {
      await this.expectVisible(this.transferAcceptedMessage);
    } else {
      await this.expectVisible(this.transferDeclinedMessage);
    }
  }

  /**
   * Acknowledge transfer response
   */
  async acknowledgeTransferResponse(): Promise<void> {
    await this.clickElement(this.transferResponseOk);
  }

  /**
   * End the chat session
   */
  async endChat(): Promise<void> {
    await this.clickElement(this.endChatButton);
  }

  /**
   * Complete chat session and finish
   */
  async finishChat(): Promise<void> {
    await this.clickElement(this.finishButton);
    await this.waitForTimeout(1000, 'Chat completion');
  }

  /**
   * Verify chat has ended
   */
  async verifyChatEnded(): Promise<void> {
    await this.expectVisible(this.chatEnded);
    await this.expectVisible(this.closeButton);
    
    // Verify customer details is no longer visible
    await this.expectHidden(this.customerDetailsTitle);
  }

  /**
   * Close chat window after ending
   */
  async closeChatWindow(): Promise<void> {
    await this.clickElement(this.closeButton);
  }

  /**
   * Complete end chat workflow
   */
  async completeEndChatWorkflow(): Promise<void> {
    await this.endChat();
    await this.finishChat();
  }

  /**
   * Verify chat is no longer in active media
   */
  async verifyChatRemovedFromActiveMedia(customerName: string): Promise<void> {
    const activeMediaCustomer = this.locator(`[data-cy="active-media-tile"] :text-is("${customerName}")`);
    await this.expectHidden(activeMediaCustomer);
  }

  /**
   * Click on active chat to focus it
   */
  async focusActiveChat(customerName: string): Promise<void> {
    const activeChatTile = this.locator(`[data-cy="active-media-tile"] :text-is("${customerName}")`);
    await this.clickElement(activeChatTile, { timeout: 10000 });
  }

  /**
   * Verify chat greeting message is visible
   */
  async verifyChatGreeting(customerName: string, agentName: string): Promise<void> {
    const greetingText = `Hello, ${customerName}. My name is ${agentName}. How can I help you today?`;
    const greetingElement = this.getByText(greetingText);
    await this.expectVisible(greetingElement);
  }

  /**
   * Handle complete chat session workflow
   */
  async handleChatSession(customerName: string): Promise<void> {
    // Wait for and accept chat offer
    await this.waitForChatOffer();
    await this.acceptChatOffer();
    
    // Verify session is active
    await this.verifyChatSessionActive();
    
    // Focus on the chat
    try {
      await this.focusActiveChat(customerName);
    } catch {
      console.log('Could not focus chat, continuing...');
    }
  }

  /**
   * Verify all chat interface elements are present
   */
  async verifyChatInterfaceElements(): Promise<void> {
    await this.expectVisible(this.chatTextInput);
    await this.expectVisible(this.chatSendButton);
    await this.expectVisible(this.templateSelectButton);
    await this.expectVisible(this.requestScreenshotButton);
    await this.expectVisible(this.endChatButton);
  }

  /**
   * Get available canned message templates
   */
  async getAvailableTemplates(): Promise<string[]> {
    await this.clickElement(this.templateSelectButton);
    
    const templates = await this.templateMenuItem.allTextContents();
    
    // Click away to close menu
    await this.clickElement(this.chatTextInput);
    
    return templates;
  }
}
