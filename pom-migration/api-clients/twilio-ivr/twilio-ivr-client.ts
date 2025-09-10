import * as crypto from 'crypto';
import * as dateFns from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';

// Import Twilio SDK
const twilio = require('twilio');

/**
 * Twilio IVR Client - Handles Interactive Voice Response testing through Twilio
 * Manages IVR call flows, parameter testing, and call result verification
 */
export class TwilioIvrClient {
  private readonly authToken: string;
  private readonly accountSid: string;
  private readonly ivrApiSid: string;
  private readonly ivrApiSecret: string;
  private readonly twilioClient: any;

  constructor() {
    this.authToken = process.env.TWILIO_AUTH_TOKEN || '';
    this.accountSid = process.env.TWILIO_ACCOUNT_SID || '';
    this.ivrApiSid = process.env.IVR_API_SID || '';
    this.ivrApiSecret = process.env.IVR_API_SECRET || '';
    
    if (!this.authToken || !this.accountSid) {
      throw new Error('Twilio credentials (TWILIO_AUTH_TOKEN, TWILIO_ACCOUNT_SID) are required');
    }
    
    this.twilioClient = new twilio(this.accountSid, this.authToken);
  }

  /**
   * Generate unique identifier for IVR call tracking
   */
  generateUniqueIdentifier(): number {
    return Date.now();
  }

  /**
   * Generate Twilio signature for webhook authentication
   */
  generateTwilioSignature(url: string, params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((result: string[], key: string) => {
        result.push(`${key}${params[key]}`);
        return result;
      }, []);

    const queryString = url + sortedParams.join('');
    const signature = crypto
      .createHmac('sha1', this.authToken)
      .update(queryString, 'utf-8')
      .digest('base64');

    return signature;
  }

  /**
   * Build HTTP options for Twilio requests
   */
  buildOptions(method: string, signature: string): RequestInit {
    return {
      method,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Twilio-Signature': signature,
      },
    };
  }

  /**
   * Build basic auth header for IVR API access
   */
  buildBasicAuth(): string {
    return 'Basic ' + Buffer.from(`${this.ivrApiSid}:${this.ivrApiSecret}`).toString('base64');
  }

  /**
   * Initiate IVR call
   */
  async initiateIvrCall(startUrl: string, params: Record<string, any> = {}): Promise<string> {
    console.log(`Initiating IVR call to: ${startUrl}`);
    
    const signature = this.generateTwilioSignature(startUrl, params);
    const options = this.buildOptions('POST', signature);
    
    try {
      const response = await fetch(startUrl, options);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const responseText = await response.text();
      
      // Extract Call SID from response
      const callSidMatch = responseText.match(/<CallSid>([^<]+)<\/CallSid>/);
      if (!callSidMatch) {
        throw new Error('Call SID not found in Twilio response');
      }
      
      const callSid = callSidMatch[1];
      console.log(`IVR call initiated successfully. Call SID: ${callSid}`);
      
      return callSid;
      
    } catch (error) {
      throw new Error(`Failed to initiate IVR call: ${error.message}`);
    }
  }

  /**
   * Poll call status until completion
   */
  async pollCallStatus(callSid: string, maxAttempts: number = 24): Promise<CallStatusResult> {
    console.log(`Polling call status for SID: ${callSid}`);
    
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      try {
        const call = await this.twilioClient.calls(callSid).fetch();
        
        console.log(`Call status: ${call.status} (attempt ${attempts + 1})`);
        
        if (call.status === 'completed' || call.status === 'failed' || call.status === 'canceled') {
          return {
            status: call.status,
            startTime: call.startTime,
            endTime: call.endTime,
            duration: call.duration,
            from: call.from,
            to: call.to
          };
        }
        
        // Wait 5 seconds before next poll
        await this.wait(5000);
        attempts++;
        
      } catch (error) {
        console.error(`Error polling call status: ${error.message}`);
        attempts++;
        
        if (attempts >= maxAttempts) {
          throw new Error(`Failed to poll call status after ${maxAttempts} attempts`);
        }
        
        await this.wait(5000);
      }
    }
    
    throw new Error(`Call status polling timed out after ${maxAttempts} attempts`);
  }

  /**
   * Check call results through external API
   */
  async checkCallResults(checkUrl: string, params: Record<string, any> = {}): Promise<any> {
    console.log(`Checking call results at: ${checkUrl}`);
    
    const signature = this.generateTwilioSignature(checkUrl, params);
    const options = this.buildOptions('POST', signature);
    
    try {
      const response = await fetch(checkUrl, options);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('Call results retrieved successfully');
      
      return result;
      
    } catch (error) {
      throw new Error(`Failed to check call results: ${error.message}`);
    }
  }

  /**
   * Format timestamp to Mountain Time Zone (America/Denver)
   */
  formatToMountainTime(timestamp: Date, format: string = 'hh:mm:ss a'): string {
    return formatInTimeZone(timestamp, 'America/Denver', format);
  }

  /**
   * Get current Mountain Time
   */
  getCurrentMountainTime(): string {
    const now = new Date();
    return now.toLocaleString('en-US', {
      timeZone: 'America/Denver',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  }

  /**
   * Build query parameters string
   */
  buildQueryParams(params: Record<string, any>): string {
    const queryParts = Object.entries(params).map(([key, value]) => `${key}=${value}`);
    return queryParts.length > 0 ? '&' + queryParts.join('&') : '';
  }

  /**
   * Execute complete IVR test workflow
   */
  async executeIvrTest(config: IvrTestConfig): Promise<IvrTestResult> {
    console.log(`Starting IVR test: ${config.testName}`);
    
    const startTime = new Date();
    const uniqueIdentifier = this.generateUniqueIdentifier();
    
    try {
      // Build URLs with unique identifier
      const startUrl = `${config.baseUrl}/start-call?uniqueIdentifier=${uniqueIdentifier}${config.queryParams || ''}`;
      const checkUrl = `${config.baseUrl}/check-results?uniqueIdentifier=${uniqueIdentifier}${config.queryParams || ''}`;
      
      // Initiate the IVR call
      const callSid = await this.initiateIvrCall(startUrl, config.params);
      
      // Wait for call to complete
      console.log(`Waiting for call completion (${config.callDuration || 20}s)...`);
      await this.wait((config.callDuration || 20) * 1000);
      
      // Poll call status
      const callStatus = await this.pollCallStatus(callSid);
      
      if (callStatus.status !== 'completed') {
        throw new Error(`Call failed with status: ${callStatus.status}`);
      }
      
      // Wait for transcriptions to complete
      console.log('Waiting for transcriptions to complete...');
      await this.wait(30000);
      
      // Check call results if URL provided
      let callResults = null;
      if (config.checkResults !== false) {
        try {
          callResults = await this.checkCallResults(checkUrl, config.params);
        } catch (error) {
          console.warn('Call results check failed:', error.message);
        }
      }
      
      const endTime = new Date();
      const testDuration = endTime.getTime() - startTime.getTime();
      
      return {
        success: true,
        callSid,
        uniqueIdentifier,
        callStatus,
        callResults,
        testDuration,
        startTime,
        endTime,
        mountainTime: this.formatToMountainTime(callStatus.startTime || startTime)
      };
      
    } catch (error) {
      console.error(`IVR test failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Find closest time for time-based IVR testing
   */
  findClosestTime(targetHour: number, targetMinute: number = 0): Date {
    const now = new Date();
    const target = new Date();
    target.setHours(targetHour, targetMinute, 0, 0);
    
    // If target time has passed today, set for tomorrow
    if (target <= now) {
      target.setDate(target.getDate() + 1);
    }
    
    return target;
  }

  /**
   * Wait for specified duration
   */
  private async wait(milliseconds: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    console.log('TwilioIvrClient cleanup completed');
  }
}

// ============================================================================
// SUPPORTING INTERFACES
// ============================================================================

export interface IvrTestConfig {
  testName: string;
  baseUrl: string;
  params?: Record<string, any>;
  queryParams?: string;
  callDuration?: number;
  checkResults?: boolean;
}

export interface CallStatusResult {
  status: 'queued' | 'ringing' | 'in-progress' | 'completed' | 'failed' | 'busy' | 'canceled';
  startTime?: Date;
  endTime?: Date;
  duration?: number;
  from?: string;
  to?: string;
}

export interface IvrTestResult {
  success: boolean;
  callSid: string;
  uniqueIdentifier: number;
  callStatus: CallStatusResult;
  callResults?: any;
  testDuration: number;
  startTime: Date;
  endTime: Date;
  mountainTime: string;
}

// ============================================================================
// IVR TEST CONFIGURATIONS
// ============================================================================

export const IVR_CONFIGS = {
  PRIMARY: {
    testName: 'Primary IVR',
    baseUrl: 'https://xima-primary-ivr-9108.twil.io'
  },
  IN_HOURS: {
    testName: 'In Hours IVR',
    baseUrl: 'https://xima-in-hours-ivr-5651.twil.io'
  },
  AFTER_HOURS: {
    testName: 'After Hours IVR',
    baseUrl: 'https://xima-after-hours-ivr-5230.twil.io'
  },
  IN_HOLIDAY: {
    testName: 'In Holiday IVR',
    baseUrl: 'https://xima-in-holiday-ivr-7436.twil.io'
  },
  NON_HOLIDAY: {
    testName: 'Non Holiday IVR',
    baseUrl: 'https://xima-non-holiday-ivr-9999.twil.io'
  },
  SET_PARAMETER: {
    testName: 'Set Parameter IVR',
    baseUrl: 'https://xima-set-parameter-ivr-6543.twil.io'
  },
  STANDARD_PARAM: {
    testName: 'Standard Parameter IVR',
    baseUrl: 'https://xima-ivr-9663.twil.io'
  },
  SESSION_PARAM: {
    testName: 'Session Parameter IVR',
    baseUrl: 'https://xima-session-parameter-ivr-2468.twil.io'
  },
  SIP_PARAM: {
    testName: 'SIP Parameter IVR',
    baseUrl: 'https://xima-sip-parameter-ivr-7890.twil.io'
  },
  COLLECT_DIGITS_A: {
    testName: 'Collect Digits A IVR',
    baseUrl: 'https://xima-collect-digits-a-ivr-5432.twil.io'
  },
  COLLECT_DIGITS_B: {
    testName: 'Collect Digits B IVR',
    baseUrl: 'https://xima-collect-digits-b-ivr-8765.twil.io'
  },
  COLLECT_DIGITS_C: {
    testName: 'Collect Digits C IVR',
    baseUrl: 'https://xima-collect-digits-c-ivr-2109.twil.io'
  },
  ANNOUNCEMENT: {
    testName: 'Announcement IVR',
    baseUrl: 'https://xima-announcement-ivr-3456.twil.io'
  },
  DROP_CALL: {
    testName: 'Drop Call IVR',
    baseUrl: 'https://xima-drop-call-ivr-7891.twil.io'
  }
} as const;

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

/**
 * Factory function to create TwilioIvrClient instance
 */
export function createTwilioIvrClient(): TwilioIvrClient {
  return new TwilioIvrClient();
}
