# WebRTC Internal Call Flows Tests

This directory contains automated tests for WebRTC internal call flow functionality using the Page Object Model (POM) pattern. These tests have been migrated 1:1 from the original JavaScript tests in `tests/web_rtc_internal_call_flows/` to TypeScript with improved structure and maintainability.

## Overview

The WebRTC internal call flow tests verify complex internal communication scenarios including agent-to-agent calls, advanced transfer workflows, cross-platform integration with UC agents, and external number routing. These tests focus on internal call management within the contact center environment with sophisticated transfer and monitoring capabilities.

## Test Files (1:1 Migration Mapping)

### Internal Transfer Scenarios
- **`web-rtc-internal-blind-transfer-to-external-number.spec.ts`** ← `web_rtc_internal_blind_transfer_to_external_number.spec.js`
- **`web-rtc-internal-assisted-transfer-to-uc-agent.spec.ts`** ← `web_rtc_internal_assisted_transfer_to_uc_agent.spec.js`
- **`web-rtc-inbound-supervised-transfer-to-skill-using-skill-selector.spec.ts`** ← `web_rtc_inbound_supervised_transfer_to_skill_using_skill_selector.spec.js`

## Key Features Tested

### Internal Agent-to-Agent Communication
- **Agent-to-Agent Calls**: Direct internal calls between WebRTC agents using extensions
- **Call Control Integration**: Hold, mute, and transfer capabilities during internal calls
- **Multi-Agent Coordination**: Complex scenarios involving 3+ agents with different skills
- **Extension Mapping**: Proper extension dialing for internal agent communication

### Advanced Transfer Workflows
- **Blind Transfer to External**: Transfer internal calls to external phone numbers without consultation
- **Assisted Transfer to UC**: Transfer WebRTC calls to UC (Unified Communications) agents with consultation
- **Supervised Transfer to Skills**: Skill-based transfers with supervisor oversight and monitoring
- **Cross-Platform Integration**: Seamless integration between WebRTC and UC platforms

### Supervisor Monitoring & Control
- **Real-time Status Tracking**: Live monitoring of multiple agents during complex transfer scenarios
- **Transfer Event Monitoring**: Real-time tracking of transfer progress and completion
- **Multi-Agent Filtering**: Advanced filtering to monitor specific agents during transfers
- **Status Change Verification**: Verification of agent status transitions during transfers

### Comprehensive Call Event Logging
- **Cradle to Grave Integration**: Detailed logging of complex transfer sequences
- **Event Sequence Verification**: Validation of proper event ordering (Queue→Talking→Transfer Hold→Queue→Talking→Transfer→Talking→Drop)
- **Skill Association Tracking**: Proper skill tracking throughout transfer workflows
- **Transfer Completion Logging**: Verification of transfer completion and final call disposition

## Page Objects Used

### WebRTC-Specific Components
- **`WebRTCCallPage`** - Call controls, transfer initiation, and call state management
- **`WebRTCDialpadPage`** - Extension dialing and number entry for transfers
- **`SupervisorViewPage`** - Multi-agent monitoring and transfer oversight

### Integration Components
- **`UserManagementPage`** - Agent configuration and skill management
- **`LoginPage`** - Authentication for WebRTC agents, UC agents, and supervisors
- **`BasePage`** - Common functionality and utilities

### API Clients
- **`WebRTCClient`** - High-level workflow orchestration for complex multi-agent scenarios

## Test Environment

### Agent Account Requirements

#### WebRTC Agents
```bash
# Internal Call Transfer Agents
WEBRTCAGENT_14_EMAIL=webrtcagent14@example.com  # Calling agent
WEBRTCAGENT_15_EMAIL=webrtcagent15@example.com  # Receiving agent

# External Transfer Agents  
WEBRTCAGENT_50_EMAIL=webrtcagent50@example.com  # Initiating agent
WEBRTCAGENT_51_EMAIL=webrtcagent51@example.com  # Transfer agent

# Supervised Transfer Agents
WEBRTCAGENT_27_EMAIL=webrtcagent27@example.com  # Primary agent
WEBRTCAGENT_29_EMAIL=webrtcagent29@example.com  # Transfer target
```

#### UC Agent Integration
```bash
# UC Agent for Cross-Platform Testing
UC_AGENT_17_EXT_117=ucagent17@example.com              # UC Agent email
UC_AGENT_17_EXT_117_PASSWORD=uc_agent_password         # UC Agent password
UC_AGENT_17_EXT_117_WEBPHONE_USERNAME=ucagent17_web    # UC Webphone username
```

#### Authentication
```bash
# Standard Authentication
DEFAULT_PASSWORD=your_default_password
WEBRTC_PASSWORD=webrtc_specific_password
SUPERVISOR_USERNAME=supervisor_username
SUPERVISOR_PASSWORD=supervisor_password
```

### Skills Configuration
Tests use specific skill assignments for transfer routing:
- **Skill 10** - Agent 27 primary skill for inbound calls
- **Skill 11** - Agent 29 skill for transfer targets
- **Skill 39** - Agent 51 skill for external transfer scenarios
- **Skill 40** - Agent 50 skill for internal calling
- **Skill 72** - UC Agent 17 skill for cross-platform transfers
- **Skill 73** - Agent 15 skill for internal call handling
- **Skill 74** - Agent 14 skill for transfer initiation

### Extension Mapping
Internal calls use specific extension numbers:
- **Agent 50 → Agent 51**: Extension 736 (7-3-6 dialpad sequence)
- **Agent 14 → Agent 15**: Extension 733 (7-3-3 dialpad sequence)
- **Agent → UC Agent 17**: Extension 117 (1-1-7 dialpad sequence)
- **External Numbers**: 8889449462 for external transfer testing

## Running Tests

### Individual Test Files
```bash
# Run external transfer test
npx playwright test pom-tests/web_rtc_internal_call_flows/web-rtc-internal-blind-transfer-to-external-number.spec.ts

# Run UC agent transfer test
npx playwright test pom-tests/web_rtc_internal_call_flows/web-rtc-internal-assisted-transfer-to-uc-agent.spec.ts

# Run supervised skill transfer test
npx playwright test pom-tests/web_rtc_internal_call_flows/web-rtc-inbound-supervised-transfer-to-skill-using-skill-selector.spec.ts
```

### Complete Test Suite
```bash
# Run all internal call flow tests
npx playwright test pom-tests/web_rtc_internal_call_flows/

# Run with extended timeouts for complex scenarios
npx playwright test pom-tests/web_rtc_internal_call_flows/ --timeout=600000
```

### Recommended Configuration
```bash
# Sequential execution recommended for internal call coordination
npx playwright test pom-tests/web_rtc_internal_call_flows/ --workers=1

# Enable media stream debugging
npx playwright test pom-tests/web_rtc_internal_call_flows/ --headed --slowMo=1000
```

## Common Test Patterns

### Multi-Agent Setup
```typescript
const webRTCClient = new WebRTCClient(page);

// Setup calling agent
const { agentDash: callingAgentDash } = await webRTCClient.setupWebRTCAgent(
  callingAgentCredentials,
  callingSkillNumber
);

// Setup receiving agent in separate context
const receivingAgentPage = await context.newPage();
const receivingAgentClient = new WebRTCClient(receivingAgentPage);
const { agentDash: receivingAgentDash } = await receivingAgentClient.setupWebRTCAgent(
  receivingAgentCredentials,
  receivingSkillNumber
);
```

### Internal Agent-to-Agent Call
```typescript
const dialpadPage = new WebRTCDialpadPage(callingAgentPage);
const callPage = new WebRTCCallPage(callingAgentPage);

// Make internal call using extension
await dialpadPage.openNewCallDialog();
await dialpadPage.dialExtension(targetExtension);

// Handle incoming call on receiving agent
const receivingCallPage = new WebRTCCallPage(receivingAgentPage);
await receivingCallPage.waitForIncomingCall();
await receivingCallPage.answerCall();
```

### Assisted Transfer to UC Agent
```typescript
// Initiate transfer from WebRTC agent
await callPage.initiateTransfer();
await dialpadPage.dialExtension(ucAgentExtension);
await callPage.confirmAssistedTransfer();

// Handle transfer on UC webphone
await ucWebPhonePage.bringToFront();
await ucWebPhonePage.locator('button:has(+ p:text-is("ANSWER"))').click();

// Complete transfer
await callPage.completeTransfer();
```

### Supervisor Monitoring with Multi-Agent Filtering
```typescript
const supervisorViewPage = new SupervisorViewPage(supervisorPage);
await supervisorViewPage.setupMultiAgentMonitoring([
  { name: 'Agent 27', number: '27' },
  { name: 'Agent 29', number: '29' }
]);

// Verify status changes during transfers
await supervisorViewPage.verifyAgentStatus('Agent 27', 'Talking');
await supervisorViewPage.verifyAgentStatus('Agent 29', 'Idle');
```

## Test Categories

### Category 1: External Integration (1 test)
- **Blind Transfer to External**: Agent 50 → Agent 51 → External Number (8889449462)
  - Internal call establishment
  - Hold/unhold functionality testing
  - Blind transfer to external phone number
  - Transfer completion verification

### Category 2: Cross-Platform Integration (1 test)  
- **Assisted Transfer to UC Agent**: WebRTC Agent 14 → Agent 15 → UC Agent 17
  - Multi-agent internal call setup
  - UC webphone integration
  - Assisted transfer with consultation
  - Cross-platform call completion

### Category 3: Skill-Based Supervised Transfers (1 test)
- **Supervised Transfer to Skill**: Agent 27 → Skill 11 → Agent 29
  - Inbound call to specific skill
  - Supervisor monitoring and filtering
  - Skill-based assisted transfer
  - Comprehensive Cradle to Grave event logging

## Advanced Scenarios

### Multi-Agent Transfer Chains
- **3+ Agent Scenarios**: Complex transfer chains involving multiple agents
- **Cross-Platform Routing**: WebRTC ↔ UC agent communication
- **Skill-Based Routing**: Transfer to skills rather than specific agents
- **External Number Integration**: Seamless external number transfer capabilities

### Supervisor Control & Monitoring
- **Real-time Multi-Agent Monitoring**: Live status tracking for multiple agents
- **Transfer Progress Tracking**: Real-time transfer event monitoring
- **Advanced Filtering**: Complex agent filtering for large environments
- **Status Transition Verification**: Detailed agent state change validation

### Event Logging & Reporting
- **Complex Event Sequences**: Multi-step transfer event tracking
- **Skill Association**: Proper skill tracking throughout transfer workflows
- **Transfer Completion Metrics**: Detailed transfer success/failure tracking
- **Cross-Platform Event Correlation**: Event tracking across WebRTC and UC platforms

## Debugging

### Common Issues
1. **Extension Mapping Errors** - Verify agent extension assignments match dialpad sequences
2. **UC Webphone Integration** - Ensure UC webphone credentials and setup are correct
3. **Multi-Agent Context Conflicts** - Use proper browser context isolation
4. **Transfer Timing Issues** - Allow adequate time for transfer establishment
5. **Supervisor Filter Delays** - Wait for status propagation in supervisor view

### Debug Configuration
```typescript
// Enable detailed logging for complex scenarios
console.log('Call ID:', callId);
console.log('Agent extensions:', { agent14: '733', agent15: '220', ucAgent17: '117' });
console.log('Transfer progress:', await callPage.getTransferStatus());

// Extended timeouts for complex workflows
await callPage.waitForIncomingCall(300000); // 5 minutes
await supervisorViewPage.waitForStatusChange(agentName, 'Talking', 120000); // 2 minutes
```

### Multi-Agent Debugging
```typescript
// Track all agent statuses during complex scenarios
const agentStatuses = await supervisorViewPage.getAllAgentStatuses();
console.log('Current agent statuses:', agentStatuses);

// Verify context isolation
console.log('Calling agent context:', callingAgentPage.context().browser());
console.log('Receiving agent context:', receivingAgentPage.context().browser());
```

## Migration Notes

These tests have been migrated 1:1 from the original JavaScript implementation with the following improvements:

### Enhanced Reliability
- **Multi-Agent Coordination**: Improved browser context management for multiple agents
- **Transfer State Tracking**: More reliable transfer progress monitoring
- **Cross-Platform Integration**: Better UC webphone integration handling
- **Error Recovery**: Enhanced error handling for complex transfer scenarios

### Improved Maintainability
- **Page Objects**: Reusable components for call controls and monitoring
- **Type Safety**: Full TypeScript implementation with WebRTC-specific types
- **Consistent Patterns**: Standardized multi-agent setup and coordination
- **Enhanced Logging**: Better debug output for complex scenarios

### Advanced Workflow Support
- **Extension Management**: Centralized extension mapping and dialing
- **Transfer Orchestration**: High-level transfer workflow management
- **Status Synchronization**: Improved agent status tracking across contexts
- **Event Correlation**: Better event tracking across multiple agents and platforms

### Original Test Mapping
- `web_rtc_internal_blind_transfer_to_external_number.spec.js` → `web-rtc-internal-blind-transfer-to-external-number.spec.ts`
- `web_rtc_internal_assisted_transfer_to_uc_agent.spec.js` → `web-rtc-internal-assisted-transfer-to-uc-agent.spec.ts`
- `web_rtc_inbound_supervised_transfer_to_skill_using_skill_selector.spec.js` → `web-rtc-inbound-supervised-transfer-to-skill-using-skill-selector.spec.ts`

## Performance Considerations

### Resource Management
- Internal call tests are highly resource-intensive due to multiple browser contexts
- Sequential execution strongly recommended to prevent conflicts
- Proper context cleanup essential for stability

### UC Integration Dependencies
- Tests require UC webphone service availability
- UC agent accounts must be properly configured
- Webphone authentication separate from regular UC login

### Call Simulation Requirements
- Tests depend on internal call routing infrastructure
- Extension mapping must match actual PBX configuration
- External number routing requires proper SIP trunk configuration

## Contributing

When adding new WebRTC internal call flow tests:

1. Use existing page objects for call controls and transfers
2. Follow established multi-agent setup patterns
3. Include proper UC integration when applicable
4. Test both successful and failed transfer scenarios
5. Add comprehensive supervisor monitoring verification
6. Include detailed Cradle to Grave event verification
7. Ensure proper browser context isolation and cleanup
8. Test extension mapping and dialpad functionality

## Support

For issues with WebRTC internal call flow testing:

1. Verify all agent accounts have proper WebRTC licensing
2. Check internal extension mapping and PBX configuration
3. Ensure UC agent accounts are properly configured for cross-platform tests
4. Verify UC webphone service availability and credentials
5. Test with sequential execution to avoid context conflicts
6. Review browser console for WebRTC signaling errors
7. Check supervisor account permissions for monitoring tests

### UC Integration Troubleshooting
- Verify UC webphone authentication credentials
- Check UC agent licensing and permissions
- Test UC webphone connectivity independently
- Verify cross-platform call routing configuration

### Extension Mapping Verification
- Confirm agent extension assignments in PBX
- Test extension dialing patterns manually
- Verify internal call routing configuration
- Check for extension conflicts or duplicates

### Transfer State Debugging
- Monitor transfer progress in browser dev tools
- Check transfer signaling logs for establishment issues
- Verify proper skill associations during transfers
- Track transfer completion events and timing

The tests maintain full compatibility with existing call infrastructure while providing improved reliability, debugging capabilities, and maintainability through the POM pattern implementation. Each test preserves the exact workflow, agent assignments, skill configurations, and verification steps from the original implementation.
