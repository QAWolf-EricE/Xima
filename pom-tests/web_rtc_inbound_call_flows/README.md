# WebRTC Inbound Call Flows Tests

This directory contains automated tests for WebRTC inbound call flow functionality using the Page Object Model (POM) pattern. These tests have been migrated 1:1 from the original JavaScript tests in `tests/web_rtc_inbound_call_flows/` to TypeScript with improved structure and maintainability.

## Overview

The WebRTC inbound call flow tests verify comprehensive voice communication scenarios for incoming calls including direct agent routing, skill-based routing, call transfers (blind, assisted, supervised), call controls, supervisor monitoring, and detailed reporting. These tests cover the complete lifecycle of inbound WebRTC call handling.

## Test Files (1:1 Migration Mapping)

### Direct Call Routing
- **`web-rtc-inbound-direct-to-agent.spec.ts`** ← `web_rtc_inbound_direct_to_agent.spec.js`
- **`web-rtc-inbound-call-presented-to-one-agent-at-a-time.spec.ts`** ← `web_rtc_inbound_call_presented_to_one_agent_at_a_time.spec.js`

### Skill-Based Call Handling
- **`web-rtc-inbound-simple-skill-call-with-mute-and-hold.spec.ts`** ← `web_rtc_inbound_simple_skill_call_with_mute_and_hold.spec.js`
- **`web-rtc-inbound-missed-call-testing.spec.ts`** ← `web_rtc_inbound_missed_call_testing.spec.js`

### Blind Transfer Scenarios
- **`web-rtc-inbound-blind-transfer-to-agent-using-dial-pad.spec.ts`** ← `web_rtc_inbound_blind_transfer_to_agent_using_dial_pad.spec.js`
- **`web-rtc-inbound-blind-transfer-to-agent-using-agent-selector.spec.ts`** ← `web_rtc_inbound_blind_transfer_to_agent_using_agent_selector.spec.js`
- **`web-rtc-inbound-blind-transfer-to-skill.spec.ts`** ← `web_rtc_inbound_blind_transfer_to_skill.spec.js`
- **`web-rtc-inbound-blind-transfer-to-skill-using-skill-selector.spec.ts`** ← `web_rtc_inbound_blind_transfer_to_skill_using_skill_selector.spec.js`

### Supervised Transfer Scenarios
- **`web-rtc-inbound-hold-supervised-transfer-to-agent.spec.ts`** ← `web_rtc_inbound_hold_supervised_transfer_to_agent.spec.js`
- **`web-rtc-inbound-hold-supervised-transfer-to-did.spec.ts`** ← `web_rtc_inbound_hold_supervised_transfer_to_did.spec.js`
- **`web-rtc-inbound-supervisor-view-transfer-to-agent-not-ready.spec.ts`** ← `web_rtc_inbound_supervisor_view_transfer_to_agent_not_ready.spec.js`

### Cross-Platform Integration
- **`web-rtc-inbound-assisted-transfer-to-uc-agent.spec.ts`** ← `web_rtc_inbound_assisted_transfer_to_uc_agent.spec.js`

## Key Features Tested

### Call Routing & Presentation
- **Direct Agent Routing**: Calls routed directly to specific agent extensions
- **Skill-Based Routing**: Calls distributed based on agent skill assignments
- **Single Agent Presentation**: Ensuring calls are presented to one agent at a time
- **Queue Management**: Call queuing when all agents with required skills are busy

### Call Controls & Management
- **Answer/Reject**: Incoming call handling with accept/reject/miss scenarios
- **Mute/Unmute**: Audio control during active calls with state verification
- **Hold/Unhold**: Call hold functionality with supervisor monitoring
- **End Call**: Call termination with after-call work (ACW) handling

### Transfer Types & Workflows
- **Blind Transfers**: Direct transfer without consultation
  - To specific agents using agent selector
  - To specific agents using dialpad/extension
  - To skill groups using skill selector
  - To skill groups using skill routing
  
- **Assisted Transfers**: Transfer with consultation
  - To WebRTC agents with pre-transfer conversation
  - To UC (Unified Communications) agents
  - Hold and supervised transfer workflows
  
- **Supervisor Transfers**: Supervisor-initiated transfers
  - From queued calls to specific agents
  - To agents not ready in the skill
  - DID-based transfer routing

### Monitoring & Reporting
- **Real-time Supervision**: Live agent status monitoring during calls
- **Status Change Tracking**: Agent state transitions (Ready→Talking→Hold→Ready)
- **Call Event Logging**: Comprehensive event tracking (Ringing, Talking, Hold, Transfer, Drop)
- **Cradle to Grave Reporting**: Detailed call logs with event sequences and timing

### Advanced Scenarios
- **Missed Call Handling**: Call forwarding when first agent misses call
- **Multi-Agent Coordination**: Complex scenarios with multiple agents and skills
- **Cross-Platform Integration**: WebRTC to UC agent transfers
- **Notes & Codes**: Customer interaction documentation during calls

## Page Objects Used

### WebRTC-Specific Pages
- **`WebRTCCallPage`** - Active call management (mute, hold, transfer, end call controls)
- **`WebRTCDialpadPage`** - Dialpad interface for number entry and transfers
- **`SupervisorViewPage`** - Real-time agent monitoring and call queue management

### Shared Components  
- **`AgentDashboardPage`** - Agent status and channel management
- **`LoginPage`** - Authentication for agents and supervisors
- **`BasePage`** - Common page object functionality

### API Clients
- **`WebRTCClient`** - High-level WebRTC workflow orchestration

## Test Environment

### Agent Accounts Required
```bash
# Primary WebRTC Agents
WEBRTCAGENT_1_EMAIL=webrtcagent1@example.com    # Agent 202
WEBRTCAGENT_2_EMAIL=webrtcagent2@example.com    # Agent 203  
WEBRTCAGENT_5_EMAIL=webrtcagent5@example.com    # Transfer scenarios
WEBRTCAGENT_6_EMAIL=webrtcagent6@example.com    # Transfer targets

# Skill-specific Agents
WEBRTCAGENT_17_EMAIL=webrtcagent17@example.com  # Missed call testing
WEBRTCAGENT_18_EMAIL=webrtcagent18@example.com  # Missed call handling
WEBRTCAGENT_30_EMAIL=webrtcagent30@example.com  # Call presentation testing
WEBRTCAGENT_31_EMAIL=webrtcagent31@example.com  # Call presentation testing

# Transfer Testing Agents
WEBRTCAGENT_36_EMAIL=webrtcagent36@example.com  # Hold/supervised transfers
WEBRTCAGENT_37_EMAIL=webrtcagent37@example.com  # DID transfers
WEBRTCAGENT_38_EMAIL=webrtcagent38@example.com  # Supervised transfers
WEBRTCAGENT_39_EMAIL=webrtcagent39@example.com  # Transfer targets
WEBRTCAGENT_42_EMAIL=webrtcagent42@example.com  # Supervisor transfers
WEBRTCAGENT_45_EMAIL=webrtcagent45@example.com  # Skill selector testing
WEBRTCAGENT_46_EMAIL=webrtcagent46@example.com  # Skill transfer targets
WEBRTCAGENT_64_EMAIL=webrtcagent64@example.com  # Mute/hold testing

# UC Integration
UC_AGENT_7_EXT_107=ucagent7@example.com         # UC Agent integration
UC_AGENT_7_EXT_107_PASSWORD=uc_password         # UC Agent password
UC_AGENT_7_EXT_107_WEBPHONE_USERNAME=ucagent7   # UC Webphone username

# Authentication
DEFAULT_PASSWORD=your_default_password
WEBRTC_PASSWORD=webrtc_specific_password
SUPERVISOR_USERNAME=supervisor_username
SUPERVISOR_PASSWORD=supervisor_password
```

### Skills Configuration
Tests use various skill numbers for routing and transfer scenarios:
- **Skill 31** - Agent selector transfer testing
- **Skill 33** - Dialpad transfer testing  
- **Skill 35** - Missed call testing
- **Skill 46** - Call presentation testing
- **Skill 48** - DID transfer testing
- **Skill 49** - Supervised transfer testing
- **Skill 50** - Direct agent testing
- **Skill 52** - Mute/hold testing
- **Skill 57** - Supervisor transfer testing
- **Skill 58** - Skill selector testing

### Call Simulation Integration
- Tests use `createCall()` helper for simulating inbound calls
- `inputDigits()` helper for skill-based call routing
- Real-time call ID tracking for debugging
- Phone number simulation for external caller ID testing

## Running Tests

### Individual Test Files
```bash
# Run specific inbound call flow tests
npx playwright test pom-tests/web_rtc_inbound_call_flows/web-rtc-inbound-direct-to-agent.spec.ts
npx playwright test pom-tests/web_rtc_inbound_call_flows/web-rtc-inbound-simple-skill-call-with-mute-and-hold.spec.ts
npx playwright test pom-tests/web_rtc_inbound_call_flows/web-rtc-inbound-blind-transfer-to-agent-using-dial-pad.spec.ts
```

### Complete Test Suite
```bash
# Run all inbound call flow tests
npx playwright test pom-tests/web_rtc_inbound_call_flows/

# Run with WebRTC-optimized settings
npx playwright test pom-tests/web_rtc_inbound_call_flows/ --headed --slowMo=1000
```

### Recommended Configuration
```bash
# Sequential execution recommended for WebRTC tests (avoid resource conflicts)
npx playwright test pom-tests/web_rtc_inbound_call_flows/ --workers=1

# Extended timeouts for call simulation
npx playwright test pom-tests/web_rtc_inbound_call_flows/ --timeout=300000
```

## Common Test Patterns

### Agent Setup for Inbound Calls
```typescript
const webRTCClient = new WebRTCClient(page);
const { agentDash, agentName } = await webRTCClient.setupWebRTCAgent(
  agentCredentials,
  skillNumber,
  { enableVoice: true }
);
```

### Simulating Inbound Calls
```typescript
const createCall = require('../../lib/node_20_helpers').createCall;
const inputDigits = require('../../lib/node_20_helpers').inputDigits;

let callId = await createCall({ number: "4352551623" });
await inputDigits(callId, [skillDigit]); // Route to specific skill

const callPage = new WebRTCCallPage(page);
await callPage.waitForIncomingCall();
await callPage.answerCall();
```

### Blind Transfer Workflow
```typescript
await callPage.initiateTransfer();
await page.click('[data-mat-icon-name="agent"]'); // or "skill"
await page.click(':text("Target Agent Name")');
await page.click('button:has-text("Blind transfer")');

// Verify transfer on receiving agent
await receivingAgent.bringToFront();
await receivingCallPage.waitForIncomingCall();
await receivingCallPage.answerCall();
```

### Assisted Transfer Workflow
```typescript
await callPage.initiateTransfer();
await dialpadPage.dialExtension(targetExtension);
await callPage.confirmAssistedTransfer();

// Handle on receiving agent
await receivingCallPage.waitForAssistedTransferAttempt();
await receivingCallPage.answerCall();

// Complete transfer
await callPage.completeTransfer();
```

### Supervisor Monitoring
```typescript
const supervisorViewPage = new SupervisorViewPage(supervisorPage);
await supervisorViewPage.monitorAgents([agentName]);
await supervisorViewPage.verifyAgentStatus(agentName, "Talking");
```

## Test Categories

### Category 1: Basic Call Handling (2 tests)
- Direct agent routing with call details verification
- Single agent presentation logic with notes/codes

### Category 2: Call Controls (2 tests)  
- Mute/hold functionality with supervisor monitoring
- Missed call handling and forwarding

### Category 3: Blind Transfers (4 tests)
- Agent-to-agent using dialpad
- Agent-to-agent using agent selector
- Skill-to-skill using skill selector
- Direct skill transfers

### Category 4: Supervised Transfers (3 tests)
- Hold and supervised transfer to agent
- Hold and supervised transfer to DID
- Supervisor view transfer to non-ready agent

### Category 5: Integration (1 test)
- WebRTC to UC agent assisted transfers

## Debugging

### Common Issues
1. **Call Simulation Timeouts** - Verify call creation service availability
2. **Agent Skill Mismatches** - Ensure agents have correct skills for routing
3. **Transfer Failures** - Verify target agents are available and ready
4. **Supervisor View Delays** - Allow time for status propagation
5. **Multi-Agent Context Issues** - Ensure proper browser context isolation

### Debug Configuration
```typescript
// Enable additional logging for call tracking
console.log("CALL ID:", callId);
console.log("Agent status:", await agentDash.getAgentStatus());

// Extended timeouts for WebRTC operations
await callPage.waitForIncomingCall(300000); // 5 minutes
```

### Call State Debugging
```typescript
// Monitor call states during debugging
const isActive = await callPage.isCallActive();
const isOnHold = await callPage.isCallOnHold();
console.log(`Call active: ${isActive}, On hold: ${isOnHold}`);
```

## Migration Notes

These tests have been migrated 1:1 from the original JavaScript implementation with the following improvements:

### Enhanced Reliability
- **Call Simulation Integration**: Improved integration with call creation helpers
- **Multi-Agent Coordination**: Better browser context management for multiple agents
- **Status Synchronization**: More reliable agent status and call state tracking
- **Error Recovery**: Enhanced error handling for call failures and timeouts

### Improved Maintainability
- **Page Objects**: Reusable components for call controls and monitoring
- **Type Safety**: Full TypeScript implementation with WebRTC-specific types
- **Consistent Patterns**: Standardized setup, execution, and cleanup procedures
- **API Clients**: High-level workflow orchestration for complex scenarios

### Test Organization
- **Logical Grouping**: Related transfer scenarios grouped by transfer type
- **Clear Documentation**: Each test includes detailed step descriptions
- **Consistent Naming**: Kebab-case naming following established patterns
- **Enhanced Logging**: Better debug output and call ID tracking

## Performance Considerations

### Browser Resource Management
- WebRTC tests require significant browser resources for media streams
- Sequential execution recommended to prevent resource conflicts
- Extended timeouts for call establishment and media negotiation

### Call Simulation Dependencies
- Tests depend on external call simulation service
- Real-time call routing requires stable network connectivity
- Skill-based routing depends on proper PBX configuration

### Multi-Agent Scenarios
- Each agent requires separate browser context for isolation
- Proper cleanup of contexts essential for stability
- Memory management important for long-running test suites

## Contributing

When adding new WebRTC inbound call flow tests:

1. Follow established agent setup patterns using `WebRTCClient`
2. Use existing page objects for call controls and monitoring
3. Include proper call simulation using helper functions
4. Test both positive and negative transfer scenarios
5. Add supervisor monitoring verification where applicable
6. Include Cradle to Grave report verification for call logging
7. Ensure proper cleanup of browser contexts and call states
8. Test error scenarios (missed calls, transfer failures, etc.)

## Support

For issues with WebRTC inbound call flow testing:

1. Verify agent accounts have proper WebRTC licensing and permissions
2. Check call simulation service connectivity and availability
3. Ensure proper skill configuration for routing tests
4. Verify supervisor account permissions for monitoring tests
5. Test with sequential execution to avoid resource conflicts
6. Review browser console for WebRTC-specific errors
7. Check network connectivity for real-time call features

### WebRTC-Specific Troubleshooting
- Verify browser media stream permissions are properly configured
- Check WebRTC server connectivity and STUN/TURN configuration
- Monitor call signaling logs for connection establishment issues
- Ensure proper codec support for WebRTC audio streams

### Call Transfer Debugging
- Verify target agents are logged in and available
- Check skill compatibility between transferring and receiving agents
- Monitor transfer state transitions in browser dev tools
- Verify proper extension/DID configuration for transfer routing

The tests maintain full compatibility with existing call simulation infrastructure while providing improved reliability, debugging capabilities, and maintainability through the POM pattern implementation.
