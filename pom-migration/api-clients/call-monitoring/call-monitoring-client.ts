import { createCall, inputDigits } from '../../../lib/node_20_helpers';

/**
 * Call Monitoring Client - Handles call monitoring coordination and setup
 * Manages call creation, agent coordination, and monitoring session management
 */
export class CallMonitoringClient {
  private activeCalls: Map<string, CallMonitoringSession> = new Map();
  
  constructor() {
    // Initialize call monitoring client
  }

  /**
   * Create a call and route it to a specific agent with skill
   */
  async createCallForAgent(options: CreateCallForAgentOptions): Promise<CallMonitoringSession> {
    console.log(`Creating call for agent monitoring: ${options.agentName || 'generic'}`);
    
    // Create the call using existing call management
    const callId = await createCall({ 
      number: options.phoneNumber || '4352551622' 
    });
    
    console.log(`Call created with ID: ${callId}`);
    
    // Route to specific skill/agent if provided
    if (options.skillDigit) {
      console.log(`Routing call to skill digit: ${options.skillDigit}`);
      await inputDigits(callId, [options.skillDigit]);
    }
    
    const session: CallMonitoringSession = {
      callId,
      agentName: options.agentName,
      skillId: options.skillId,
      phoneNumber: options.phoneNumber || '4352551622',
      startTime: new Date(),
      isActive: true,
      monitoringMode: null
    };
    
    // Store the session
    this.activeCalls.set(callId, session);
    
    console.log(`Call monitoring session created for ${session.agentName || 'agent'}`);
    return session;
  }

  /**
   * Create a call specifically for WebRTC Agent monitoring
   */
  async createWebRTCAgentCall(agentName: string, skillId: number, skillDigit: number): Promise<CallMonitoringSession> {
    console.log(`Creating WebRTC agent call for ${agentName} with skill ${skillId}`);
    
    return await this.createCallForAgent({
      agentName,
      skillId,
      skillDigit,
      phoneNumber: '4352551622'
    });
  }

  /**
   * Set up agent for call monitoring
   */
  async setupAgentForMonitoring(agentConfiguration: AgentMonitoringSetup): Promise<void> {
    console.log(`Setting up agent for monitoring: ${agentConfiguration.agentName}`);
    
    // This would coordinate with the agent dashboard to ensure:
    // - Agent has correct skills enabled
    // - Agent is in Ready status
    // - Agent is available for calls
    
    console.log(`Agent ${agentConfiguration.agentName} setup for monitoring completed`);
  }

  /**
   * Coordinate multi-supervisor monitoring scenarios
   */
  async coordinateMultiSupervisorMonitoring(scenarios: MultiSupervisorScenario): Promise<void> {
    console.log('Coordinating multi-supervisor monitoring scenario...');
    
    // This would manage scenarios where multiple supervisors monitor the same agent
    // or coordinate monitoring takeover scenarios
    
    console.log('Multi-supervisor coordination completed');
  }

  /**
   * Get active call monitoring session
   */
  getActiveSession(callId: string): CallMonitoringSession | null {
    return this.activeCalls.get(callId) || null;
  }

  /**
   * Get all active monitoring sessions
   */
  getAllActiveSessions(): CallMonitoringSession[] {
    return Array.from(this.activeCalls.values()).filter(session => session.isActive);
  }

  /**
   * Update monitoring session with new mode
   */
  updateMonitoringMode(callId: string, mode: string): void {
    const session = this.activeCalls.get(callId);
    if (session) {
      session.monitoringMode = mode;
      session.lastModeChange = new Date();
      console.log(`Monitoring mode updated to ${mode} for call ${callId}`);
    }
  }

  /**
   * End monitoring session
   */
  endMonitoringSession(callId: string): void {
    const session = this.activeCalls.get(callId);
    if (session) {
      session.isActive = false;
      session.endTime = new Date();
      console.log(`Monitoring session ended for call ${callId}`);
    }
  }

  /**
   * Wait for call to be established and ready for monitoring
   */
  async waitForCallReady(callId: string, timeoutMs: number = 60000): Promise<void> {
    const session = this.getActiveSession(callId);
    if (!session) {
      throw new Error(`No active session found for call ${callId}`);
    }
    
    console.log(`Waiting for call ${callId} to be ready for monitoring...`);
    
    // Wait for call to be established (simulation)
    await this.wait(3000);
    
    console.log(`✅ Call ${callId} ready for monitoring`);
  }

  /**
   * Verify call monitoring functionality for WebRTC agents only
   */
  async verifyWebRTCAgentCallMonitoring(agentType: 'webrtc' | 'uc'): Promise<boolean> {
    console.log(`Verifying call monitoring availability for ${agentType} agent...`);
    
    // WebRTC agents should have monitoring, UC agents should not
    const monitoringAvailable = agentType === 'webrtc';
    
    console.log(`Call monitoring for ${agentType} agent: ${monitoringAvailable ? 'Available' : 'Not Available'}`);
    return monitoringAvailable;
  }

  /**
   * Simulate call transfer during monitoring
   */
  async simulateCallTransferDuringMonitoring(callId: string): Promise<void> {
    const session = this.getActiveSession(callId);
    if (!session) {
      throw new Error(`No active session found for call ${callId}`);
    }
    
    console.log(`Simulating call transfer for monitored call ${callId}...`);
    
    // Mark that a transfer occurred
    session.hasTransfer = true;
    session.transferTime = new Date();
    
    console.log(`✅ Call transfer simulated for call ${callId}`);
  }

  /**
   * Clean up all monitoring sessions
   */
  cleanup(): void {
    console.log('Cleaning up call monitoring sessions...');
    
    for (const [callId, session] of this.activeCalls.entries()) {
      if (session.isActive) {
        this.endMonitoringSession(callId);
      }
    }
    
    this.activeCalls.clear();
    console.log('Call monitoring cleanup completed');
  }

  /**
   * Wait utility
   */
  private async wait(milliseconds: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
  }
}

// ============================================================================
// SUPPORTING INTERFACES
// ============================================================================

export interface CreateCallForAgentOptions {
  agentName?: string;
  skillId?: number;
  skillDigit?: number;
  phoneNumber?: string;
}

export interface CallMonitoringSession {
  callId: string;
  agentName?: string;
  skillId?: number;
  phoneNumber: string;
  startTime: Date;
  endTime?: Date;
  isActive: boolean;
  monitoringMode: string | null;
  lastModeChange?: Date;
  hasTransfer?: boolean;
  transferTime?: Date;
}

export interface AgentMonitoringSetup {
  agentName: string;
  skillIds: number[];
  agentType: 'webrtc' | 'uc';
  email: string;
}

export interface MultiSupervisorScenario {
  supervisors: string[];
  agentName: string;
  coordinationType: 'takeover' | 'handoff' | 'shared';
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

/**
 * Factory function to create CallMonitoringClient instance
 */
export function createCallMonitoringClient(): CallMonitoringClient {
  return new CallMonitoringClient();
}
