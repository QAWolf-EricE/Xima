import { RecordingMode, RecordingState } from '../../pages/agent/call-recording-page';
import * as dateFns from 'date-fns';

/**
 * Recording Management Client - Handles call recording coordination and verification
 * Manages recording sessions, mode configuration, and multi-user recording coordination
 */
export class RecordingManagementClient {
  private activeRecordingSessions: Map<string, RecordingSession> = new Map();
  private agentRecordingConfigurations: Map<string, AgentRecordingConfig> = new Map();
  
  constructor() {
    // Initialize recording management client
  }

  /**
   * Create recording session for tracking
   */
  createRecordingSession(options: RecordingSessionOptions): RecordingSession {
    console.log(`Creating recording session: ${options.sessionName}`);
    
    const session: RecordingSession = {
      sessionName: options.sessionName,
      agentName: options.agentName,
      recordingMode: options.recordingMode,
      startTime: new Date(),
      isActive: true,
      callId: options.callId,
      recordings: []
    };
    
    this.activeRecordingSessions.set(options.sessionName, session);
    
    console.log(`Recording session created: ${options.sessionName}`);
    return session;
  }

  /**
   * Configure agent recording mode
   */
  configureAgentRecording(agentName: string, recordingMode: RecordingMode): void {
    console.log(`Configuring agent recording: ${agentName} → ${recordingMode}`);
    
    const config: AgentRecordingConfig = {
      agentName,
      recordingMode,
      configurationTime: new Date(),
      isActive: true,
      pauseAllowed: recordingMode !== RecordingMode.AUTOMATIC_PAUSE_PROHIBITED,
      manualControlRequired: recordingMode === RecordingMode.MANUAL
    };
    
    this.agentRecordingConfigurations.set(agentName, config);
    
    console.log(`Agent recording configuration set: ${agentName} - ${recordingMode}`);
  }

  /**
   * Verify agent recording configuration
   */
  getAgentRecordingConfig(agentName: string): AgentRecordingConfig | null {
    return this.agentRecordingConfigurations.get(agentName) || null;
  }

  /**
   * Add recording event to session
   */
  addRecordingEvent(sessionName: string, event: RecordingEvent): void {
    const session = this.activeRecordingSessions.get(sessionName);
    if (session) {
      session.recordings.push(event);
      console.log(`Recording event added: ${event.type} at ${event.timestamp.toISOString()}`);
    }
  }

  /**
   * Verify recording mode compliance
   */
  verifyRecordingModeCompliance(agentName: string, expectedBehavior: RecordingBehavior): boolean {
    const config = this.getAgentRecordingConfig(agentName);
    if (!config) {
      return false;
    }
    
    const compliance = {
      automatic: config.recordingMode === RecordingMode.AUTOMATIC && expectedBehavior.shouldAutoStart,
      manual: config.recordingMode === RecordingMode.MANUAL && expectedBehavior.requiresManualStart,
      disabled: config.recordingMode === RecordingMode.DISABLED && expectedBehavior.shouldBeDisabled,
      pauseProhibited: config.recordingMode === RecordingMode.AUTOMATIC_PAUSE_PROHIBITED && !expectedBehavior.allowsPause
    };
    
    const isCompliant = Object.values(compliance).some(c => c === true);
    
    console.log(`Recording mode compliance check: ${isCompliant ? 'Pass' : 'Fail'}`);
    return isCompliant;
  }

  /**
   * Generate date for recording reports (yesterday)
   */
  generateRecordingReportDate(): string {
    const yesterday = dateFns.sub(new Date(), { days: 1 });
    return dateFns.format(yesterday, 'MMMM d,');
  }

  /**
   * Coordinate multi-user recording testing
   */
  coordinateMultiUserRecordingTest(options: MultiUserRecordingOptions): MultiUserRecordingCoordination {
    console.log('Coordinating multi-user recording test...');
    
    const coordination: MultiUserRecordingCoordination = {
      agentName: options.agentName,
      supervisorId: options.supervisorId,
      recordingMode: options.recordingMode,
      callCoordination: {
        callEstablished: false,
        recordingActive: false,
        recordingVerified: false
      },
      startTime: new Date()
    };
    
    // Configure agent recording
    this.configureAgentRecording(options.agentName, options.recordingMode);
    
    // Create recording session
    this.createRecordingSession({
      sessionName: `${options.agentName}_${options.recordingMode}_Session`,
      agentName: options.agentName,
      recordingMode: options.recordingMode,
      callId: options.callId
    });
    
    console.log('✅ Multi-user recording test coordination set up');
    return coordination;
  }

  /**
   * Verify recording in reports system
   */
  async verifyRecordingInReports(agentName: string, dateFilter?: Date): Promise<RecordingReportVerification> {
    console.log(`Verifying recording in reports for: ${agentName}`);
    
    const reportDate = dateFilter ? dateFns.format(dateFilter, 'MMMM d,') : this.generateRecordingReportDate();
    
    const verification: RecordingReportVerification = {
      agentName,
      searchDate: reportDate,
      recordingFound: false, // Would be determined by actual report check
      reportGenerated: new Date()
    };
    
    // In production, this would check the actual reports
    console.log(`Recording report verification prepared for: ${agentName} on ${reportDate}`);
    
    return verification;
  }

  /**
   * Get recording session
   */
  getRecordingSession(sessionName: string): RecordingSession | null {
    return this.activeRecordingSessions.get(sessionName) || null;
  }

  /**
   * End recording session
   */
  endRecordingSession(sessionName: string): void {
    const session = this.activeRecordingSessions.get(sessionName);
    if (session) {
      session.isActive = false;
      session.endTime = new Date();
      console.log(`Recording session ended: ${sessionName}`);
    }
  }

  /**
   * Get all active recording sessions
   */
  getActiveRecordingSessions(): RecordingSession[] {
    return Array.from(this.activeRecordingSessions.values()).filter(session => session.isActive);
  }

  /**
   * Cleanup all recording management resources
   */
  cleanup(): void {
    console.log('Cleaning up recording management resources...');
    
    for (const [sessionName, session] of this.activeRecordingSessions.entries()) {
      if (session.isActive) {
        this.endRecordingSession(sessionName);
      }
    }
    
    this.activeRecordingSessions.clear();
    this.agentRecordingConfigurations.clear();
    
    console.log('Recording management cleanup completed');
  }
}

// ============================================================================
// SUPPORTING INTERFACES
// ============================================================================

export interface RecordingSession {
  sessionName: string;
  agentName: string;
  recordingMode: RecordingMode;
  startTime: Date;
  endTime?: Date;
  isActive: boolean;
  callId?: string;
  recordings: RecordingEvent[];
}

export interface RecordingSessionOptions {
  sessionName: string;
  agentName: string;
  recordingMode: RecordingMode;
  callId?: string;
}

export interface AgentRecordingConfig {
  agentName: string;
  recordingMode: RecordingMode;
  configurationTime: Date;
  isActive: boolean;
  pauseAllowed: boolean;
  manualControlRequired: boolean;
}

export interface RecordingEvent {
  type: 'start' | 'pause' | 'resume' | 'stop';
  timestamp: Date;
  userInitiated: boolean;
  automatic: boolean;
}

export interface RecordingBehavior {
  shouldAutoStart: boolean;
  requiresManualStart: boolean;
  shouldBeDisabled: boolean;
  allowsPause: boolean;
}

export interface MultiUserRecordingOptions {
  agentName: string;
  supervisorId: string;
  recordingMode: RecordingMode;
  callId?: string;
}

export interface MultiUserRecordingCoordination {
  agentName: string;
  supervisorId: string;
  recordingMode: RecordingMode;
  callCoordination: {
    callEstablished: boolean;
    recordingActive: boolean;
    recordingVerified: boolean;
  };
  startTime: Date;
  endTime?: Date;
}

export interface RecordingReportVerification {
  agentName: string;
  searchDate: string;
  recordingFound: boolean;
  reportGenerated: Date;
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

/**
 * Factory function to create RecordingManagementClient instance
 */
export function createRecordingManagementClient(): RecordingManagementClient {
  return new RecordingManagementClient();
}

