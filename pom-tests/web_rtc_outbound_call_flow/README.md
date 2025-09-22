# WebRTC Outbound Call Flow Tests

This directory contains automated tests for WebRTC outbound call flow functionality using the Page Object Model (POM) pattern. These tests have been migrated 1:1 from the original JavaScript tests in `tests/web_rtc_outbound_call_flow/` to TypeScript with improved structure and maintainability.

## Overview

The WebRTC outbound call flow tests verify comprehensive outbound voice communication scenarios including outbound call creation, call controls during outbound calls, transfer workflows from outbound calls, error handling for invalid numbers, and supervisor monitoring of outbound call activities. These tests cover the complete lifecycle of outbound WebRTC call management.

## Test Files (1:1 Migration Mapping)

### Basic Outbound Call Management
- **`web-rtc-outbound-simple-outbound-call-with-mute-and-hold.spec.ts`** ← `web_rtc_outbound_simple_outbound_call_with_mute_and_hold.spec.js`
- **`web-rtc-outbound-dial-an-incorrect-number.spec.ts`** ← `web_rtc_outbound_dial_an_incorrect_number.spec.js`

### Outbound Call Transfer Scenarios
- **`web-rtc-outbound-blind-transfer-to-agent-using-agent-selector.spec.ts`** ← `web_rtc_outbound_blind_transfer_to_agent_using_agent_selector.spec.js`
- **`web-rtc-outbound-hold-supervised-transfer-to-agent.spec.ts`** ← `web_rtc_outbound_hold_supervised_transfer_to_agent.spec.js`
- **`web-rtc-outbound-hold-supervised-transfer-to-did.spec.ts`** ← `web_rtc_outbound_hold_supervised_transfer_to_did.spec.js`

## Key Features Tested

### Outbound Call Creation & Management
- **Dialpad Integration**: Phone number entry through WebRTC dialpad interface
- **Skill Selection**: Skill-based outbound call routing and assignment
- **Call Establishment**: Outbound call connection and verification
- **Number Validation**: Error handling for invalid/incorrect phone numbers

### Call Controls During Outbound Calls
- **Mute/Unmute**: Audio control with visual state verification
- **Hold/Unhold**: Call hold functionality with supervisor monitoring
- **Call Active Status**: Real-time call state tracking and verification
- **After Call Work (ACW)**: Post-call workflow and timer management

### Transfer Workflows from Outbound Calls
- **Blind Transfer to Agent**: Direct transfer using agent selector without consultation
- **Assisted Transfer to Agent**: Transfer with pre-transfer consultation and verification
- **Supervised Transfer to DID**: Transfer to external numbers/extensions with supervision
- **Transfer State Management**: Proper transfer state tracking and completion verification

### Supervisor Monitoring Integration
- **Real-time Status Monitoring**: Live tracking of agent status during outbound calls
- **Call State Visualization**: Supervisor view of Talking, Hold, and Transfer states
- **Multi-Agent Filtering**: Advanced filtering for monitoring specific agents
- **Transfer Progress Tracking**: Real-time monitoring of transfer workflows

### Error Handling & Validation
- **Invalid Number Detection**: Proper error messaging for incorrect phone numbers
- **Call Failure Handling**: Graceful handling of failed outbound calls
- **Transfer Error Recovery**: Error handling during transfer scenarios
- **Cleanup Procedures**: Proper call termination and resource cleanup

### Reporting & Analytics
- **Cradle to Grave Integration**: Comprehensive outbound call event logging
- **Event Sequence Tracking**: Proper logging of Talking, Hold, Transfer, and Drop events
- **Transfer Event Documentation**: Detailed transfer event tracking in reports
- **Call Duration Metrics**: Timing and duration tracking for outbound calls

## Page Objects Used

### WebRTC-Specific Components
- **`WebRTCCallPage`** - Call controls, transfer management, and call state verification
- **`WebRTCDialpadPage`** - Outbound number entry and dialpad functionality
- **`SupervisorViewPage`** - Real-time agent monitoring and filtering

### Shared Components
- **`AgentDashboardPage`** - Agent status and channel management
- **`LoginPage`** - Authentication for agents and supervisors
- **`BasePage`** - Common page object functionality

### API Clients
- **`WebRTCClient`** - High-level outbound call workflow orchestration

## Test Environment

### Agent Account Requirements

#### Primary Outbound Call Agents
```bash
WEBRTCAGENT_58_EMAIL=webrtcagent58@example.com  # Supervised transfer caller
WEBRTCAGENT_59_EMAIL=webrtcagent59@example.com  # Supervised transfer target
WEBRTCAGENT_60_EMAIL=webrtcagent60@example.com  # Blind transfer caller
WEBRTCAGENT_61_EMAIL=webrtcagent61@example.com  # Blind transfer target
WEBRTCAGENT_62_EMAIL=webrtcagent62@example.com  # DID transfer caller
WEBRTCAGENT_63_EMAIL=webrtcagent63@example.com  # DID transfer target
WEBRTCAGENT_65_EMAIL=webrtcagent65@example.com  # Basic outbound testing
WEBRTCAGENT_66_EMAIL=webrtcagent66@example.com  # Invalid number testing
```

#### Authentication
```bash
DEFAULT_PASSWORD=your_default_password
WEBRTC_PASSWORD=webrtc_specific_password
SUPERVISOR_USERNAME=supervisor_username
SUPERVISOR_PASSWORD=supervisor_password
```

### Skills Configuration
Tests use specific skill assignments for outbound call routing:
- **Skill 8** - Agent 65 for basic outbound call testing
- **Skill 43** - Agent 58 for supervised transfer scenarios
- **Skill 44** - Agent 59 for transfer target scenarios
- **Skill 53** - Agent 61 for blind transfer targets
- **Skill 54** - Agent 60 for blind transfer initiation
- **Skill 55** - Agent 63 for DID transfer scenarios
- **Skill 56** - Agent 62 for DID transfer initiation

### External Dependencies
- **Outbound Number Service**: Tests require `getOutBoundNumber()` helper for generating test phone numbers
- **Invalid Number Patterns**: Tests use specific invalid number patterns (191-555-0788)
- **DID Routing**: Tests require proper DID configuration for external transfers

## Running Tests

### Individual Test Files
```bash
# Run basic outbound call test
npx playwright test pom-tests/web_rtc_outbound_call_flow/web-rtc-outbound-simple-outbound-call-with-mute-and-hold.spec.ts

# Run invalid number handling test
npx playwright test pom-tests/web_rtc_outbound_call_flow/web-rtc-outbound-dial-an-incorrect-number.spec.ts

# Run blind transfer test
npx playwright test pom-tests/web_rtc_outbound_call_flow/web-rtc-outbound-blind-transfer-to-agent-using-agent-selector.spec.ts

# Run supervised transfer tests
npx playwright test pom-tests/web_rtc_outbound_call_flow/web-rtc-outbound-hold-supervised-transfer-to-agent.spec.ts
npx playwright test pom-tests/web_rtc_outbound_call_flow/web-rtc-outbound-hold-supervised-transfer-to-did.spec.ts
```

### Complete Test Suite
```bash
# Run all outbound call flow tests
npx playwright test pom-tests/web_rtc_outbound_call_flow/

# Run with extended timeouts for complex scenarios
npx playwright test pom-tests/web_rtc_outbound_call_flow/ --timeout=300000
```

### Recommended Configuration
```bash
# Sequential execution recommended for outbound call coordination
npx playwright test pom-tests/web_rtc_outbound_call_flow/ --workers=1

# Enable media stream debugging
npx playwright test pom-tests/web_rtc_outbound_call_flow/ --headed --slowMo=1000
```

## Common Test Patterns

### Basic Outbound Call Setup
```typescript
const webRTCClient = new WebRTCClient(page);
const { agentDash } = await webRTCClient.setupWebRTCAgent(
  agentCredentials,
  skillNumber
);

// Get test phone number
const getOutBoundNumber = require('../../lib/node_20_helpers').getOutBoundNumber;
const outboundNumber = await getOutBoundNumber();

// Make outbound call
const dialpadPage = new WebRTCDialpadPage(page);
await dialpadPage.makeOutboundCall(outboundNumber, skillNumber);
```

### Call Controls Testing
```typescript
const callPage = new WebRTCCallPage(page);

// Test mute functionality
await callPage.muteCall();
await callPage.unmuteCall();

// Test hold functionality with supervisor monitoring
await callPage.holdCall();
await supervisorViewPage.verifyAgentStatus(agentName, "Hold");
await callPage.unholdCall();
```

### Blind Transfer Workflow
```typescript
// Initiate blind transfer
await callPage.initiateTransfer();
await page.click('[role="tab"]:has([data-mat-icon-name="agent"])');
await page.click(':text("Target Agent Name")');
await page.click(':text("Blind Transfer")');

// Verify transfer on receiving agent
await receivingAgent.bringToFront();
await receivingCallPage.waitForIncomingCall();
await receivingCallPage.answerCall();
```

### Assisted Transfer Workflow
```typescript
// Initiate assisted transfer
await callPage.initiateTransfer();
await page.click('[role="tab"]:has([data-mat-icon-name="agent"])');
await page.click(':text("Target Agent Name")');
await page.click(':text("Assisted Transfer")');

// Handle transfer on receiving agent
await receivingCallPage.waitForAssistedTransferAttempt();
await receivingCallPage.answerCall();

// Complete transfer
await callPage.completeTransfer();
```

### Invalid Number Error Handling
```typescript
const dialpadPage = new WebRTCDialpadPage(page);

// Attempt invalid number
await dialpadPage.openNewCallDialog();
await page.fill('[data-cy="dialpad-text"] #phoneNumberInput', invalidNumber);
await page.click('[data-cy="call-button"]');

// Verify error message
await expect(page.locator(':text("There was an issue making outbound call")')).toBeVisible();
```

## Test Categories

### Category 1: Basic Outbound Functionality (2 tests)
- **Simple Outbound Call**: Complete workflow with mute/hold and supervisor monitoring
- **Invalid Number Handling**: Error detection and handling for incorrect phone numbers

### Category 2: Transfer Scenarios (3 tests)
- **Blind Transfer to Agent**: Direct transfer using agent selector interface
- **Supervised Transfer to Agent**: Transfer with hold, consultation, and completion
- **Supervised Transfer to DID**: Transfer to external numbers/extensions

## Debugging

### Common Issues
1. **Outbound Number Service** - Verify `getOutBoundNumber()` helper availability
2. **Skill Mismatches** - Ensure agents have correct skills for outbound routing
3. **Transfer Target Availability** - Verify target agents are ready and available
4. **Supervisor Filter Delays** - Allow time for status propagation in supervisor view
5. **Invalid Number Patterns** - Use proper invalid number formats for error testing

### Debug Configuration
```typescript
// Enable detailed logging for outbound calls
const outboundNumber = await getOutBoundNumber();
console.log('Calling outbound number:', outboundNumber);
console.log('Agent skill assignment:', skillNumber);

// Extended timeouts for outbound call establishment
await callPage.waitForCallConnection(120000); // 2 minutes
```

### Call Transfer Debugging
```typescript
// Monitor transfer progress
console.log('Initiating transfer to:', targetAgent);
await callPage.initiateTransfer();

// Verify transfer completion
const transferCompleted = await callPage.isTransferCompleted();
console.log('Transfer completed:', transferCompleted);
```

## Migration Notes

These tests have been migrated 1:1 from the original JavaScript implementation with the following improvements:

### Enhanced Reliability
- **Outbound Number Management**: Improved integration with phone number generation service
- **Multi-Agent Coordination**: Better browser context management for transfer scenarios
- **Error Handling**: Enhanced error recovery for call failures and invalid numbers
- **Transfer State Tracking**: More reliable transfer progress monitoring

### Improved Maintainability
- **Page Objects**: Reusable components for outbound call controls and transfers
- **Type Safety**: Full TypeScript implementation with outbound call-specific types
- **Consistent Patterns**: Standardized outbound call setup and execution procedures
- **API Clients**: High-level workflow orchestration for complex transfer scenarios

### Enhanced Testing Capabilities
- **Call State Verification**: Improved call state tracking and validation
- **Supervisor Integration**: Better supervisor monitoring and filtering
- **Transfer Verification**: Enhanced transfer completion and state verification
- **Error Scenario Testing**: Comprehensive invalid number and error handling tests

### Original Test Mapping
- `web_rtc_outbound_simple_outbound_call_with_mute_and_hold.spec.js` → `web-rtc-outbound-simple-outbound-call-with-mute-and-hold.spec.ts`
- `web_rtc_outbound_dial_an_incorrect_number.spec.js` → `web-rtc-outbound-dial-an-incorrect-number.spec.ts`
- `web_rtc_outbound_blind_transfer_to_agent_using_agent_selector.spec.js` → `web-rtc-outbound-blind-transfer-to-agent-using-agent-selector.spec.ts`
- `web_rtc_outbound_hold_supervised_transfer_to_agent.spec.js` → `web-rtc-outbound-hold-supervised-transfer-to-agent.spec.ts`
- `web_rtc_outbound_hold_supervised_transfer_to_did.spec.js` → `web-rtc-outbound-hold-supervised-transfer-to-did.spec.ts`

## Performance Considerations

### Resource Management
- Outbound call tests require external phone number service integration
- Sequential execution recommended to prevent conflicts with shared resources
- Proper cleanup of active calls essential for test stability

### Call Establishment Dependencies
- Tests depend on external outbound call routing service
- Phone number generation service must be available and responsive
- Skill-based routing requires proper PBX configuration

### Transfer Scenario Complexity
- Multi-agent transfer tests use multiple browser contexts
- Transfer timing dependent on network latency and call establishment
- Supervisor monitoring requires real-time status synchronization

## Contributing

When adding new WebRTC outbound call flow tests:

1. Use existing page objects for outbound call controls and transfers
2. Follow established agent setup patterns using `WebRTCClient`
3. Include proper outbound number generation using helper functions
4. Test both successful and failed outbound call scenarios
5. Add comprehensive supervisor monitoring verification
6. Include transfer scenarios for both agent and DID targets
7. Ensure proper cleanup of browser contexts and call states
8. Test error scenarios (invalid numbers, transfer failures, etc.)

## Support

For issues with WebRTC outbound call flow testing:

1. Verify agent accounts have proper outbound calling permissions
2. Check outbound number generation service availability
3. Ensure proper skill configuration for outbound call routing
4. Verify supervisor account permissions for monitoring tests
5. Test with sequential execution to avoid resource conflicts
6. Review browser console for WebRTC signaling errors
7. Check external number routing and DID configuration

### Outbound Call Specific Troubleshooting
- Verify outbound trunk configuration and availability
- Check phone number formatting and validation rules
- Test outbound call permissions for agent accounts
- Verify skill-based outbound routing configuration

### Transfer Scenario Debugging
- Monitor transfer progress in browser dev tools
- Check transfer target agent availability and readiness
- Verify proper skill compatibility for transfers
- Test transfer completion timeouts and retry logic

### Error Handling Verification
- Test with various invalid number patterns
- Verify proper error message display and handling
- Check call cleanup after error scenarios
- Test recovery from failed outbound attempts

The tests maintain full compatibility with existing outbound call infrastructure while providing improved reliability, debugging capabilities, and maintainability through the POM pattern implementation. Each test preserves the exact workflow, agent assignments, skill configurations, and verification steps from the original implementation while adding enhanced error handling and monitoring capabilities.
