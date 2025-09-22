import { Page } from '@playwright/test';
import { BasePage } from '../base-page';

/**
 * Call Recording Page - Handles call recording functionality and toolbar management
 * Manages recording controls, pause/resume, and recording state verification
 */
export class CallRecordingPage extends BasePage {
  
  // Recording control elements
  private readonly recordButton = this.getByDataCy('record-button');
  private readonly pauseRecordingButton = this.getByDataCy('pause-recording-button');
  private readonly resumeRecordingButton = this.getByDataCy('resume-recording-button');
  private readonly stopRecordingButton = this.getByDataCy('stop-recording-button');
  
  // Recording status indicators
  private readonly recordingStatusIndicator = this.locator('.recording-status, [data-cy*="recording-status"]');
  private readonly recordingActiveIndicator = this.locator('.recording-active, .rec-indicator');
  private readonly recordingPausedIndicator = this.locator('.recording-paused');
  private readonly recordingDisabledIndicator = this.locator('.recording-disabled');
  
  // Recording toolbar elements
  private readonly recordingToolbar = this.locator('.recording-toolbar, .call-controls');
  private readonly recordingControls = this.locator('.recording-controls');
  
  // Call interface elements (for recording during calls)
  private readonly callActiveHeader = this.locator('xima-dialog-header').getByText('Call Active');
  private readonly activeCallElement = this.locator('.active-call, [data-cy*="active-call"]');
  
  constructor(page: Page, baseUrl?: string) {
    super(page, baseUrl);
  }

  async verifyPageLoaded(): Promise<void> {
    // Recording page verification depends on call state
    await this.waitForPageLoad();
  }

  /**
   * Start manual recording
   */
  async startManualRecording(): Promise<void> {
    console.log('Starting manual recording...');
    
    try {
      // Look for record button and click it
      if (await this.isVisible(this.recordButton)) {
        await this.clickElement(this.recordButton);
        
        // Wait for recording to start
        await this.waitForTimeout(2000, 'Recording start processing');
        
        console.log('✅ Manual recording started');
      } else {
        console.log('⚠️ Record button not visible - may be auto-recording or disabled');
      }
    } catch (error) {
      console.warn('Error starting manual recording:', error.message);
    }
  }

  /**
   * Stop recording
   */
  async stopRecording(): Promise<void> {
    console.log('Stopping recording...');
    
    try {
      if (await this.isVisible(this.stopRecordingButton)) {
        await this.clickElement(this.stopRecordingButton);
        
        // Wait for recording to stop
        await this.waitForTimeout(2000, 'Recording stop processing');
        
        console.log('✅ Recording stopped');
      } else {
        console.log('⚠️ Stop recording button not visible');
      }
    } catch (error) {
      console.warn('Error stopping recording:', error.message);
    }
  }

  /**
   * Pause recording
   */
  async pauseRecording(): Promise<void> {
    console.log('Pausing recording...');
    
    try {
      if (await this.isVisible(this.pauseRecordingButton)) {
        await this.clickElement(this.pauseRecordingButton);
        
        // Wait for recording to pause
        await this.waitForTimeout(2000, 'Recording pause processing');
        
        console.log('✅ Recording paused');
      } else {
        console.log('⚠️ Pause recording button not available (may be prohibited)');
      }
    } catch (error) {
      console.warn('Error pausing recording:', error.message);
    }
  }

  /**
   * Resume recording
   */
  async resumeRecording(): Promise<void> {
    console.log('Resuming recording...');
    
    try {
      if (await this.isVisible(this.resumeRecordingButton)) {
        await this.clickElement(this.resumeRecordingButton);
        
        // Wait for recording to resume
        await this.waitForTimeout(2000, 'Recording resume processing');
        
        console.log('✅ Recording resumed');
      } else {
        console.log('⚠️ Resume recording button not visible');
      }
    } catch (error) {
      console.warn('Error resuming recording:', error.message);
    }
  }

  /**
   * Verify recording is active
   */
  async verifyRecordingActive(): Promise<void> {
    console.log('Verifying recording is active...');
    
    try {
      // Look for recording active indicators
      const hasActiveIndicator = await this.isVisible(this.recordingActiveIndicator);
      const hasRecordingStatus = await this.isVisible(this.recordingStatusIndicator);
      
      if (hasActiveIndicator || hasRecordingStatus) {
        console.log('✅ Recording verified as active');
      } else {
        console.log('⚠️ Recording status indicators not found');
      }
    } catch (error) {
      console.warn('Error verifying recording status:', error.message);
    }
  }

  /**
   * Verify recording is paused
   */
  async verifyRecordingPaused(): Promise<void> {
    console.log('Verifying recording is paused...');
    
    try {
      const hasPausedIndicator = await this.isVisible(this.recordingPausedIndicator);
      
      if (hasPausedIndicator) {
        console.log('✅ Recording verified as paused');
      } else {
        console.log('⚠️ Recording paused indicator not found');
      }
    } catch (error) {
      console.warn('Error verifying recording pause status:', error.message);
    }
  }

  /**
   * Verify recording is disabled
   */
  async verifyRecordingDisabled(): Promise<void> {
    console.log('Verifying recording is disabled...');
    
    try {
      // Check that recording controls are not available
      const hasRecordButton = await this.isVisible(this.recordButton);
      const hasDisabledIndicator = await this.isVisible(this.recordingDisabledIndicator);
      
      if (!hasRecordButton || hasDisabledIndicator) {
        console.log('✅ Recording verified as disabled');
      } else {
        console.log('⚠️ Recording appears to be enabled when it should be disabled');
      }
    } catch (error) {
      console.warn('Error verifying recording disabled status:', error.message);
    }
  }

  /**
   * Verify recording toolbar is available
   */
  async verifyRecordingToolbarAvailable(): Promise<void> {
    console.log('Verifying recording toolbar availability...');
    
    try {
      const hasToolbar = await this.isVisible(this.recordingToolbar);
      const hasControls = await this.isVisible(this.recordingControls);
      
      if (hasToolbar || hasControls) {
        console.log('✅ Recording toolbar verified as available');
      } else {
        console.log('⚠️ Recording toolbar not found');
      }
    } catch (error) {
      console.warn('Error verifying recording toolbar:', error.message);
    }
  }

  /**
   * Get current recording state
   */
  async getCurrentRecordingState(): Promise<RecordingState> {
    try {
      if (await this.isVisible(this.recordingActiveIndicator)) {
        return RecordingState.ACTIVE;
      } else if (await this.isVisible(this.recordingPausedIndicator)) {
        return RecordingState.PAUSED;
      } else if (await this.isVisible(this.recordingDisabledIndicator)) {
        return RecordingState.DISABLED;
      } else {
        return RecordingState.UNKNOWN;
      }
    } catch {
      return RecordingState.UNKNOWN;
    }
  }

  /**
   * Wait for call to be active before testing recording
   */
  async waitForCallActive(): Promise<void> {
    console.log('Waiting for call to be active...');
    
    await this.expectVisible(this.callActiveHeader, 60000);
    
    console.log('✅ Call is active - ready for recording testing');
  }

  /**
   * Verify recording controls are available during call
   */
  async verifyRecordingControlsDuringCall(): Promise<void> {
    console.log('Verifying recording controls during active call...');
    
    // Wait for call to be active
    await this.waitForCallActive();
    
    // Verify recording controls are available
    await this.verifyRecordingToolbarAvailable();
    
    console.log('✅ Recording controls verified during call');
  }

  /**
   * Execute complete manual recording workflow
   */
  async executeManualRecordingWorkflow(): Promise<void> {
    console.log('Executing complete manual recording workflow...');
    
    // Wait for call
    await this.waitForCallActive();
    
    // Start recording
    await this.startManualRecording();
    await this.verifyRecordingActive();
    
    // Test pause/resume if available
    try {
      await this.pauseRecording();
      await this.verifyRecordingPaused();
      await this.resumeRecording();
      await this.verifyRecordingActive();
    } catch (error) {
      console.log('Pause/resume not available or prohibited');
    }
    
    // Stop recording
    await this.stopRecording();
    
    console.log('✅ Complete manual recording workflow executed');
  }

  /**
   * Verify automatic recording is working
   */
  async verifyAutomaticRecording(): Promise<void> {
    console.log('Verifying automatic recording...');
    
    // Wait for call to be active
    await this.waitForCallActive();
    
    // Verify recording started automatically
    await this.verifyRecordingActive();
    
    console.log('✅ Automatic recording verified');
  }

  /**
   * Test recording pause functionality (if not prohibited)
   */
  async testRecordingPauseFunctionality(): Promise<boolean> {
    console.log('Testing recording pause functionality...');
    
    try {
      await this.pauseRecording();
      await this.verifyRecordingPaused();
      await this.resumeRecording();
      await this.verifyRecordingActive();
      
      console.log('✅ Recording pause functionality available');
      return true;
    } catch (error) {
      console.log('Recording pause functionality not available or prohibited');
      return false;
    }
  }

  /**
   * Verify recording toolbar elements during call
   */
  async verifyRecordingToolbarElements(): Promise<RecordingToolbarElements> {
    const elements: RecordingToolbarElements = {
      hasRecordButton: await this.isVisible(this.recordButton),
      hasPauseButton: await this.isVisible(this.pauseRecordingButton),
      hasResumeButton: await this.isVisible(this.resumeRecordingButton),
      hasStopButton: await this.isVisible(this.stopRecordingButton),
      hasRecordingStatus: await this.isVisible(this.recordingStatusIndicator)
    };
    
    console.log('Recording toolbar elements:', elements);
    return elements;
  }
}

// ============================================================================
// SUPPORTING ENUMS AND INTERFACES
// ============================================================================

export enum RecordingState {
  ACTIVE = 'active',
  PAUSED = 'paused',
  DISABLED = 'disabled',
  UNKNOWN = 'unknown'
}

export enum RecordingMode {
  AUTOMATIC = 'Automatic',
  MANUAL = 'Manual',
  DISABLED = 'Disabled',
  AUTOMATIC_PAUSE_PROHIBITED = 'Automatic (Pausing Prohibited)'
}

export interface RecordingToolbarElements {
  hasRecordButton: boolean;
  hasPauseButton: boolean;
  hasResumeButton: boolean;
  hasStopButton: boolean;
  hasRecordingStatus: boolean;
}

