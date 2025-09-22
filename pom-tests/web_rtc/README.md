# WebRTC Tests

This directory contains automated tests for WebRTC (Web Real-Time Communication) functionality using the Page Object Model (POM) pattern. These tests have been migrated from the original JavaScript tests across multiple directories (`tests/web_rtc/`, `tests/web_rtc_administration/`, `tests/web_rtc_inbound_call_flows/`, `tests/web_rtc_internal_call_flows/`, `tests/web_rtc_outbound_call_flow/`) to TypeScript with improved structure and maintainability.

## Overview

The WebRTC tests verify comprehensive voice communication capabilities including agent-to-agent calls, inbound/outbound call handling, call transfers, supervisor monitoring, and administrative functions. This covers the complete lifecycle of WebRTC voice interactions within the contact center environment.

## Test Files

### Administration & User Management
- **`webrtc-administration.spec.ts`** - WebRTC agent creation, licensing (CCAAS_VOICE), email verification, password setup, and user management

### Call Flow Testing
- **`webrtc-inbound-call-flows.spec.ts`** - Inbound call handling, presentation logic, call controls, supervisor monitoring, and missed call scenarios
- **`webrtc-outbound-call-flows.spec.ts`** - Outbound call creation, dialpad functionality, call controls, skill selection, and transfer scenarios  
- **`webrtc-internal-call-flows.spec.ts`** - Internal agent-to-agent calls, assisted transfers, supervised transfers, and multi-agent workflows

## Key Features Tested

### Call Management
- **Inbound Calls**: Direct routing, skill-based routing, queue management, call presentation
- **Outbound Calls**: Dialpad number entry, skill selection, external number calling
- **Internal Calls**: Agent-to-agent communication, extension dialing, transfer workflows

### Call Controls & Features  
- **Basic Controls**: Answer, hold, mute, end call functionality
- **Transfer Types**: Blind transfers, assisted transfers, supervised transfers
- **Call States**: Ringing, talking, hold, transfer hold, after call work
- **Multi-tasking**: Multiple call handling, call queuing, capacity management

### Transfer Scenarios
- **Assisted Transfers**: Agent speaks with transfer target before completing
- **Blind Transfers**: Direct transfer without consultation to agents or external numbers
- **Supervised Transfers**: Manager oversight and control of transfer process
- **Skill-based Transfers**: Transfers to skill groups rather than specific agents

### Administration
- **Agent Creation**: Complete workflow with email verification and password setup
- **License Management**: CCAAS_VOICE license assignment and verification
- **User Management**: Agent creation, deletion, license assignment
- **Password Management**: Secure password generation and reset workflows

### Monitoring & Reporting
- **Real-time Monitoring**: Supervisor view of agent status during calls
- **Call State Tracking**: Real-time status updates (Ready, Talking, Hold, etc.)
- **Cradle to Grave**: Comprehensive call event logging and reporting
- **Transfer Logging**: Detailed tracking of transfer events and participants

## Page Objects Used

### Core WebRTC Pages
- **`WebRTCCallPage`** - Active call management and controls (mute, hold, transfer, end)
- **`WebRTCDialpadPage`** - Dialpad interface for number entry and outbound calls
- **`SupervisorViewPage`** - Real-time agent monitoring and filtering
- **`UserManagementPage`** - Agent creation, licensing, and administration

### Shared Components
- **`AgentDashboardPage`** - Agent dashboard with status and channel management
- **`LoginPage`** - Authentication for agents and supervisors
- **`BasePage`** - Common page object functionality and utilities

### API Clients
- **`WebRTCClient`** - High-level WebRTC workflow management and orchestration

## Test Environment

### Agent Accounts
Tests require multiple WebRTC agent accounts for different scenarios:
- `WEBRTCAGENT_1_EMAIL` through `WEBRTCAGENT_78_EMAIL` - Various agent accounts for testing
- `UCAGENT_1_EMAIL` - UC (Unified Communications) agent for hybrid scenarios
- `SUPERVISOR_EMAIL` - Supervisor account for monitoring and reports

### Skills Configuration
Tests use various skill numbers for routing and transfer scenarios:
- Skills 8, 9, 10, 11, 12, 13 - Outbound call scenarios
- Skills 14, 15, 16, 17, 18 - Internal call and transfer scenarios  
- Skills 41, 42, 50, 51, 52, 53, 54, 55 - Inbound call scenarios
- Each skill represents different routing groups for call distribution

### Browser Configuration
WebRTC tests require special browser configurations:
```javascript
{
  args: [
    "--use-fake-ui-for-media-stream",
    "--use-fake-device-for-media-stream"
  ],
  permissions: ["microphone", "camera"],
  slowMo: 1000  // For better stability with media streams
}
```

## Configuration

### Environment Variables Required
```bash
# WebRTC Agent Accounts (numbered 1-78+)
WEBRTCAGENT_1_EMAIL=webrtcagent1@example.com
WEBRTCAGENT_55_EMAIL=webrtcagent55@example.com
WEBRTCAGENT_65_EMAIL=webrtcagent65@example.com
# ... additional agent accounts as needed

# UC Agent Accounts
UCAGENT_1_EMAIL=ucagent1@example.com

# Supervisor Account
SUPERVISOR_EMAIL=supervisor@example.com
SUPERVISOR_USERNAME=supervisor_username
SUPERVISOR_PASSWORD=supervisor_password

# Authentication
DEFAULT_PASSWORD=your_password_here
WEBRTC_PASSWORD=webrtc_specific_password

# Application URLs
DEFAULT_URL=https://your-contact-center.com
```

### External Dependencies
- **Email Service**: Tests require email inbox service for agent creation verification
- **WebRTC Call Simulation**: Helper functions for simulating inbound calls
- **Phone Number Generation**: Service for generating test outbound numbers

## Running Tests

### Individual Test Files
```bash
# Run WebRTC administration tests
npx playwright test pom-tests/web_rtc/webrtc-administration.spec.ts

# Run inbound call flow tests
npx playwright test pom-tests/web_rtc/webrtc-inbound-call-flows.spec.ts

# Run outbound call flow tests  
npx playwright test pom-tests/web_rtc/webrtc-outbound-call-flows.spec.ts

# Run internal call flow tests
npx playwright test pom-tests/web_rtc/webrtc-internal-call-flows.spec.ts
```

### Complete WebRTC Test Suite
```bash
# Run all WebRTC tests
npx playwright test pom-tests/web_rtc/

# Run with media stream debugging
npx playwright test pom-tests/web_rtc/ --headed --slowMo=2000

# Run with specific browser for WebRTC compatibility
npx playwright test pom-tests/web_rtc/ --project=chromium
```

### Parallel vs Sequential Execution
```bash
# Parallel execution (default, but may cause conflicts with shared resources)
npx playwright test pom-tests/web_rtc/ --workers=2

# Sequential execution (recommended for WebRTC tests)
npx playwright test pom-tests/web_rtc/ --workers=1
```

## Common Test Patterns

### Agent Setup for WebRTC
```typescript
const webRTCClient = new WebRTCClient(page);
const { agentDash, agentName } = await webRTCClient.setupWebRTCAgent(
  agentCredentials,
  skillNumber,
  { enableVoice: true, enableChat: false, enableEmail: false }
);
```

### Inbound Call Handling
```typescript
const callPage = new WebRTCCallPage(page);
await callPage.waitForIncomingCall();
await callPage.answerCall();
await callPage.verifyCallActive();
```

### Outbound Call Creation
```typescript
const { callPage, dialpadPage } = await webRTCClient.createOutboundCall(
  phoneNumber,
  skillNumber
);
```

### Internal Call Between Agents
```typescript
const { callingCallPage, receivingCallPage } = await webRTCClient.performInternalCall(
  callingAgentPage,
  receivingAgentPage,  
  targetExtension
);
```

### Assisted Transfer Workflow
```typescript
await webRTCClient.performAssistedTransfer(
  transferringAgentPage,
  receivingAgentPage,
  targetExtension
);
```

### Supervisor Monitoring
```typescript
const supervisorViewPage = await webRTCClient.monitorAgentStatus(
  supervisorPage,
  [agentName1, agentName2]
);

await webRTCClient.verifyAgentStatusInSupervisorView(
  supervisorViewPage,
  agentName,
  'Talking'
);
```

## Debugging

### Common Issues
1. **Media Stream Permissions** - Ensure browser launched with fake media stream flags
2. **Agent Not Ready** - Verify agent status, skills, and voice channel enablement  
3. **Call Connection Timeouts** - Check network connectivity and WebRTC server status
4. **Transfer Failures** - Ensure all agents have compatible skills and are available
5. **Supervisor Monitoring** - Verify supervisor has proper permissions and agent filters

### Debug Configuration
```typescript
// Enable additional logging and slower execution
const webRTCClient = new WebRTCClient(page);
await page.setDefaultTimeout(60000); // Longer timeouts for media operations
await page.setDefaultNavigationTimeout(60000);
```

### Call State Debugging
```typescript
// Check call state during debugging
const isActive = await callPage.isCallActive();
const isOnHold = await callPage.isCallOnHold();
console.log(`Call active: ${isActive}, On hold: ${isOnHold}`);
```

## Migration Notes

These tests have been migrated from multiple JavaScript test directories with the following improvements:

### Consolidated Structure
- **Original**: 5 separate directories with 23 individual test files
- **New**: 4 organized test files covering all scenarios with logical grouping

### Enhanced Reliability
- **Media Stream Handling**: Improved WebRTC media stream setup and teardown
- **Multi-Agent Coordination**: Better context management for multiple agent scenarios  
- **Call State Management**: More robust call state tracking and verification
- **Error Recovery**: Enhanced error handling for call failures and timeouts

### Improved Maintainability
- **Page Objects**: Reusable components for dialpad, call controls, and monitoring
- **API Clients**: High-level workflow orchestration for complex scenarios
- **Type Safety**: Full TypeScript implementation with proper WebRTC types
- **Consistent Patterns**: Standardized setup, execution, and cleanup procedures

### Original Test Mapping
- `web_rtc_agent_creation.spec.js` → `webrtc-administration.spec.ts`
- `web_rtc_inbound_direct_to_agent.spec.js` → `webrtc-inbound-call-flows.spec.ts`
- `web_rtc_outbound_simple_outbound_call_with_mute_and_hold.spec.js` → `webrtc-outbound-call-flows.spec.ts`
- `web_rtc_internal_assisted_transfer_using_dialpad.spec.js` → `webrtc-internal-call-flows.spec.ts`
- Multiple transfer tests → Consolidated into appropriate call flow categories

## Performance Considerations

### Browser Resource Management
- WebRTC tests are resource-intensive due to media stream processing
- Limit parallel execution to prevent browser resource conflicts
- Use appropriate timeouts for media stream establishment

### Test Isolation
- Each test creates separate browser contexts for multiple agents
- Proper cleanup of contexts and media streams is essential
- Sequential execution recommended for stability

### Call Simulation
- Tests use helper functions to simulate external calls
- Real phone numbers are not called to avoid charges
- Test numbers are generated for outbound scenarios

## Contributing

When adding new WebRTC tests:

1. Use existing page objects when possible
2. Follow established agent setup patterns
3. Include proper media stream configuration
4. Test both positive and negative scenarios
5. Add supervisor monitoring verification where applicable
6. Include Cradle to Grave report verification
7. Ensure proper cleanup of browser contexts
8. Test transfer scenarios thoroughly
9. Verify call state transitions

## Support

For issues with WebRTC testing:

1. Verify browser media stream permissions are configured correctly
2. Check agent account availability and licensing
3. Ensure WebRTC server connectivity
4. Review browser console for WebRTC-specific errors
5. Test with sequential execution to avoid resource conflicts
6. Verify supervisor account permissions for monitoring tests
7. Check skill configuration for routing tests

### WebRTC-Specific Debugging
- Monitor browser media stream establishment
- Check WebRTC connection state in browser dev tools
- Verify STUN/TURN server configuration if applicable
- Review call signaling logs for connection issues

## Advanced Scenarios

### Multi-Agent Transfer Chains
Tests support complex transfer scenarios with multiple agents:
- A→B→C transfer chains
- Conference calls with multiple participants  
- Skill-based routing with fallback options

### Supervisor Monitoring Integration
Real-time monitoring capabilities:
- Agent status changes during calls
- Call state transitions (Ready→Talking→Hold→Ready)
- Transfer event tracking and logging

### Error Recovery Testing
Comprehensive error handling:
- Network disconnection scenarios
- Agent unavailability handling
- Call timeout and retry logic
- Media stream failure recovery
