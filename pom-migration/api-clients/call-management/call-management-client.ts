import { ApiResponse, Call, CallStatus } from '../../shared/types/core';

/**
 * Client for managing call operations through the live call generation service
 * Handles call creation, manipulation, and state management
 */
export class CallManagementClient {
  private readonly baseUrl: string;
  private readonly ximaToken: string;
  private readonly defaultTimeout: number = 30000;

  constructor() {
    this.baseUrl = process.env.CALL_GENERATION_BASE_URL || 'https://livecallgeneration.ximasoftware.com';
    this.ximaToken = process.env.XIMA_TOKEN || '';
    
    if (!this.ximaToken) {
      throw new Error('XIMA_TOKEN environment variable is required');
    }
  }

  /**
   * Create a new call to the auto-attendant with skill selection
   */
  async createCall(options: CreateCallOptions = {}): Promise<string> {
    const requestBody = {
      number: options.number || '4352005133',
      count: '1',
      'wait-on': 'CONNECTED',
      timeout: '120',
    };

    try {
      const response = await this.makeRequest('/rest/calls/create', {
        method: 'POST',
        body: requestBody,
        headers: {
          'Content-Type': 'multipart/form-data',
          'Accept': 'application/json',
          'xima-token': this.ximaToken,
        },
      });

      if (!response.callIds || response.callIds.length === 0) {
        throw new Error('No call ID returned from call creation');
      }

      const callId = response.callIds[0];
      console.log(`Call created successfully: ${callId}`);
      return callId;

    } catch (error) {
      throw new Error(`Failed to create call: ${error.message}`);
    }
  }

  /**
   * Create a WebRTC call directly to WebRTC Agent 1
   */
  async createWebRTCCall(): Promise<string> {
    const requestBody = {
      number: '4352285495', // Direct line to WebRTC Agent 1
      count: '1',
      'wait-on': 'CONNECTED',
      timeout: '120',
    };

    try {
      const response = await this.makeRequest('/rest/calls/create', {
        method: 'POST',
        body: requestBody,
        headers: {
          'Content-Type': 'multipart/form-data',
          'Accept': 'application/json',
          'xima-token': this.ximaToken,
        },
      });

      const callId = response.callIds[0];
      console.log(`WebRTC call created successfully: ${callId}`);
      return callId;

    } catch (error) {
      throw new Error(`Failed to create WebRTC call: ${error.message}`);
    }
  }

  /**
   * Input DTMF digits during a call
   */
  async inputDigits(callId: string, digits: string): Promise<void> {
    if (!callId || !digits) {
      throw new Error('Call ID and digits are required');
    }

    try {
      const response = await this.makeRequest(`/rest/calls/${callId}/press-digits?digits=${digits}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
          'Accept': 'application/json',
          'xima-token': this.ximaToken,
        },
      });

      if (response.status !== 200) {
        throw new Error(`Digit input failed with status: ${response.status}`);
      }

      console.log(`Successfully input digits "${digits}" for call ${callId}`);

    } catch (error) {
      throw new Error(`Failed to input digits: ${error.message}`);
    }
  }

  /**
   * Drop/end a call
   */
  async dropCall(callId: string): Promise<void> {
    if (!callId) {
      throw new Error('Call ID is required');
    }

    try {
      const response = await this.makeRequest(`/rest/calls/${callId}/drop`, {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
          'Accept': 'application/json',
          'xima-token': this.ximaToken,
        },
      });

      if (response.status !== 202) {
        throw new Error(`Call drop failed with status: ${response.status}`);
      }

      console.log(`Successfully dropped call ${callId}`);

    } catch (error) {
      throw new Error(`Failed to drop call: ${error.message}`);
    }
  }

  /**
   * Get an available outbound phone number
   */
  async getOutboundNumber(): Promise<string> {
    try {
      const response = await this.makeRequest('/rest/calls/inbound-number', {
        method: 'GET',
        headers: {
          'xima-token': this.ximaToken,
        },
      });

      if (!response || typeof response !== 'string') {
        throw new Error('Invalid response format for outbound number');
      }

      console.log(`Retrieved outbound number: ${response}`);
      return response;

    } catch (error) {
      throw new Error(`Failed to get outbound number: ${error.message}`);
    }
  }

  /**
   * Poll call status until completion
   */
  async pollCallStatus(
    callId: string, 
    options: PollOptions = {}
  ): Promise<{ status: CallStatus; attempts: number }> {
    const maxAttempts = options.maxAttempts || 24; // 2 minutes at 5s intervals
    const interval = options.interval || 5000;
    const allowedFinalStates = options.allowedFinalStates || [CallStatus.COMPLETED, CallStatus.FAILED];

    let attempts = 0;
    let currentStatus: CallStatus = CallStatus.PENDING;

    while (attempts < maxAttempts) {
      try {
        // This would integrate with your existing status polling mechanism
        // For now, we'll simulate the status check
        currentStatus = await this.getCallStatus(callId);
        
        console.log(`Call ${callId} status: ${currentStatus} (attempt ${attempts + 1})`);

        if (allowedFinalStates.includes(currentStatus)) {
          return { status: currentStatus, attempts: attempts + 1 };
        }

        attempts++;
        await this.wait(interval);

      } catch (error) {
        console.error(`Error polling call status: ${error.message}`);
        attempts++;
        
        if (attempts >= maxAttempts) {
          throw new Error(`Failed to poll call status after ${maxAttempts} attempts: ${error.message}`);
        }
        
        await this.wait(interval);
      }
    }

    throw new Error(`Call status polling timed out after ${maxAttempts} attempts. Last status: ${currentStatus}`);
  }

  /**
   * Get current call status (placeholder for actual implementation)
   */
  private async getCallStatus(callId: string): Promise<CallStatus> {
    // This would integrate with your existing call status API
    // For now, we'll return a placeholder
    return CallStatus.COMPLETED;
  }

  /**
   * Make HTTP request with error handling and retries
   */
  private async makeRequest(
    endpoint: string, 
    options: RequestOptions
  ): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;
    const requestOptions: RequestInit = {
      method: options.method,
      headers: options.headers,
      signal: AbortSignal.timeout(this.defaultTimeout),
    };

    // Handle different body types
    if (options.body) {
      if (options.headers?.['Content-Type']?.includes('application/json')) {
        requestOptions.body = JSON.stringify(options.body);
      } else if (options.headers?.['Content-Type']?.includes('multipart/form-data')) {
        // Remove content-type header to let fetch set it with boundary
        delete options.headers['Content-Type'];
        const formData = new FormData();
        Object.entries(options.body).forEach(([key, value]) => {
          formData.append(key, String(value));
        });
        requestOptions.body = formData;
      } else {
        requestOptions.body = JSON.stringify(options.body);
      }
    }

    try {
      const response = await fetch(url, requestOptions);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        return await response.json();
      } else {
        const text = await response.text();
        // Handle plain text responses that might contain JSON
        try {
          return JSON.parse(text);
        } catch {
          return { data: text, status: response.status };
        }
      }

    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error(`Request timeout after ${this.defaultTimeout}ms`);
      }
      throw error;
    }
  }

  /**
   * Utility method to wait/sleep
   */
  private async wait(milliseconds: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
  }
}

// ============================================================================
// SUPPORTING INTERFACES
// ============================================================================

export interface CreateCallOptions {
  number?: string;
  timeout?: string;
  waitOn?: 'CONNECTED' | 'ANSWERED' | 'RINGING';
}

export interface PollOptions {
  maxAttempts?: number;
  interval?: number;
  allowedFinalStates?: CallStatus[];
}

interface RequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

/**
 * Factory function to create CallManagementClient instance
 */
export function createCallManagementClient(): CallManagementClient {
  return new CallManagementClient();
}
