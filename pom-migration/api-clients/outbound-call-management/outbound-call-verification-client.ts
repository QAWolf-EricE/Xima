const twilio = require('twilio');

/**
 * Outbound Call Verification Client - Handles Twilio call verification for outbound calls
 * Manages verification of outbound calls including caller ID verification
 */
export class OutboundCallVerificationClient {
  private readonly twilioClient: any;
  private readonly accountSid: string;
  private readonly authToken: string;

  constructor() {
    this.accountSid = process.env.TWILIO_ACCOUNT_SID || '';
    this.authToken = process.env.TWILIO_AUTH_TOKEN || '';
    
    if (!this.accountSid || !this.authToken) {
      throw new Error('Twilio credentials (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN) are required');
    }
    
    this.twilioClient = twilio(this.accountSid, this.authToken);
  }

  /**
   * Verify outbound call with specific caller ID
   */
  async verifyOutboundCallWithCallerId(options: OutboundCallVerificationOptions): Promise<OutboundCallVerificationResult> {
    console.log(`Verifying outbound call to ${options.toNumber} with caller ID ${options.expectedCallerId}`);
    
    try {
      // Get list of recent calls to the target number
      const callList = await this.twilioClient.calls.list({
        to: this.formatPhoneNumber(options.toNumber),
        limit: options.limit || 10
      });
      
      console.log(`Retrieved ${callList.length} recent calls to ${options.toNumber}`);
      
      // Find call with expected caller ID
      const callWithExpectedId = callList.find(
        (call: any) => call.from === this.formatPhoneNumber(options.expectedCallerId)
      );
      
      if (callWithExpectedId) {
        console.log(`✅ Call found with expected caller ID: ${options.expectedCallerId}`);
        console.log(`Call details: SID=${callWithExpectedId.sid}, Status=${callWithExpectedId.status}`);
        
        return {
          success: true,
          callFound: true,
          callSid: callWithExpectedId.sid,
          fromNumber: callWithExpectedId.from,
          toNumber: callWithExpectedId.to,
          callStatus: callWithExpectedId.status,
          startTime: callWithExpectedId.startTime,
          endTime: callWithExpectedId.endTime,
          duration: callWithExpectedId.duration
        };
      } else {
        console.warn(`❌ No call found with expected caller ID: ${options.expectedCallerId}`);
        
        // Log available caller IDs for debugging
        const availableCallerIds = callList.map((call: any) => call.from);
        console.log('Available caller IDs in recent calls:', availableCallerIds);
        
        return {
          success: false,
          callFound: false,
          callSid: null,
          fromNumber: null,
          toNumber: options.toNumber,
          callStatus: 'not_found',
          availableCallerIds: availableCallerIds
        };
      }
      
    } catch (error) {
      console.error('Error verifying outbound call:', error.message);
      throw new Error(`Failed to verify outbound call: ${error.message}`);
    }
  }

  /**
   * Get recent calls to a specific number
   */
  async getRecentCallsToNumber(toNumber: string, limit: number = 10): Promise<TwilioCallRecord[]> {
    console.log(`Retrieving recent calls to ${toNumber}`);
    
    try {
      const callList = await this.twilioClient.calls.list({
        to: this.formatPhoneNumber(toNumber),
        limit: limit
      });
      
      const formattedCalls = callList.map((call: any): TwilioCallRecord => ({
        sid: call.sid,
        from: call.from,
        to: call.to,
        status: call.status,
        startTime: call.startTime,
        endTime: call.endTime,
        duration: call.duration
      }));
      
      console.log(`Retrieved ${formattedCalls.length} recent calls`);
      return formattedCalls;
      
    } catch (error) {
      throw new Error(`Failed to retrieve calls: ${error.message}`);
    }
  }

  /**
   * Verify caller ID appears correctly in Twilio
   */
  async verifyCallerId(toNumber: string, expectedCallerId: string): Promise<boolean> {
    console.log(`Verifying caller ID ${expectedCallerId} for calls to ${toNumber}`);
    
    const verificationResult = await this.verifyOutboundCallWithCallerId({
      toNumber,
      expectedCallerId,
      limit: 10
    });
    
    return verificationResult.success && verificationResult.callFound;
  }

  /**
   * Wait for outbound call to appear in Twilio logs
   */
  async waitForOutboundCall(
    toNumber: string, 
    expectedCallerId: string, 
    timeoutMs: number = 60000
  ): Promise<OutboundCallVerificationResult> {
    console.log(`Waiting for outbound call to appear in Twilio logs...`);
    
    const startTime = Date.now();
    const checkInterval = 5000; // Check every 5 seconds
    
    while (Date.now() - startTime < timeoutMs) {
      try {
        const result = await this.verifyOutboundCallWithCallerId({
          toNumber,
          expectedCallerId,
          limit: 5
        });
        
        if (result.success && result.callFound) {
          console.log('✅ Outbound call found in Twilio logs');
          return result;
        }
        
        console.log('Call not yet found, waiting...');
        await this.wait(checkInterval);
        
      } catch (error) {
        console.warn('Error checking for call:', error.message);
        await this.wait(checkInterval);
      }
    }
    
    throw new Error(`Outbound call not found in Twilio logs within ${timeoutMs}ms`);
  }

  /**
   * Format phone number to E.164 format
   */
  private formatPhoneNumber(phoneNumber: string): string {
    // Remove any non-numeric characters
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    // Add +1 prefix if not present (for US numbers)
    if (cleaned.length === 10) {
      return `+1${cleaned}`;
    } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `+${cleaned}`;
    } else if (cleaned.startsWith('+')) {
      return cleaned;
    } else {
      return `+1${cleaned}`;
    }
  }

  /**
   * Wait utility
   */
  private async wait(milliseconds: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    console.log('OutboundCallVerificationClient cleanup completed');
  }
}

// ============================================================================
// SUPPORTING INTERFACES
// ============================================================================

export interface OutboundCallVerificationOptions {
  toNumber: string;
  expectedCallerId: string;
  limit?: number;
}

export interface OutboundCallVerificationResult {
  success: boolean;
  callFound: boolean;
  callSid: string | null;
  fromNumber: string | null;
  toNumber: string;
  callStatus: string;
  startTime?: Date;
  endTime?: Date;
  duration?: number;
  availableCallerIds?: string[];
}

export interface TwilioCallRecord {
  sid: string;
  from: string;
  to: string;
  status: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

/**
 * Factory function to create OutboundCallVerificationClient instance
 */
export function createOutboundCallVerificationClient(): OutboundCallVerificationClient {
  return new OutboundCallVerificationClient();
}

