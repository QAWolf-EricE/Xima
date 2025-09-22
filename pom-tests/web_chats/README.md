# Web Chat Tests

This directory contains automated tests for web chat functionality using the Page Object Model (POM) pattern. These tests have been migrated from the original JavaScript tests in `tests/web_chats/` to TypeScript with improved structure and maintainability.

## Overview

The web chat tests verify the complete lifecycle of web chat interactions between customers on external blog sites and agents in the CCAC (Contact Center Agent Console). This includes chat creation, agent handling, message exchange, transfers, and reporting.

## Test Files

### Core Functionality
- **`create-a-web-chat.spec.ts`** - Complete web chat lifecycle including creation, interaction, screenshots, notes, and reporting
- **`chat-transfer.spec.ts`** - Chat transfer functionality between agents with rejection, timeout, and acceptance scenarios  
- **`end-chat-and-log-out.spec.ts`** - Chat completion, ending, and agent logout workflows

### Agent Management  
- **`agent-status-management.spec.ts`** - Agent status changes (Ready, Busy, Lunch) and their impact on chat availability
- **`mark-agent-as-ready.spec.ts`** - Agent readiness verification and chat availability testing
- **`web-chats-agent-chat-limits.spec.ts`** - Chat limits per agent and queue management when at capacity

### Queue Management
- **`chat-queue-management.spec.ts`** - Chat queuing, missed chat handling, multi-agent distribution, and abandonment

## Key Features Tested

### Chat Creation & Connection
- Blog widget interaction and branding
- Customer information collection (name/email)
- Queue management when agents busy
- Agent offer handling (accept/reject/timeout)
- Connection establishment between customer and agent

### Message Exchange
- Bidirectional messaging (customer ↔ agent)
- Real-time typing indicators
- Message delivery verification
- Canned message templates
- Message history preservation

### Advanced Features
- Screenshot requests and responses
- Customer notes and codes management
- Chat transfers between agents
- Multi-chat sessions per agent
- Chat limits and capacity management

### Agent Management
- Status management (Ready, Busy, Lunch, Away)
- Skill group assignment and routing
- Channel enabling/disabling (Voice, Chat, Email)
- Multi-agent coordination

### Reporting & Analytics
- Cradle to Grave report verification
- Chat history logging
- Transfer tracking
- Duration and timing metrics

## Page Objects Used

### External Pages
- **`BlogChatPage`** - Customer-facing blog chat widget interactions
- **`WebChatClientPage`** - External chat client functionality

### Agent Pages  
- **`AgentDashboardPage`** - Agent dashboard and status management
- **`ChatSessionPage`** - Active chat session management
- **`LoginPage`** - Agent authentication

### API Clients
- **`WebChatClient`** - High-level web chat workflow management

## Test Environment

### Blog Test Pages
Tests use external blog pages on `chattestxima.blogspot.com` with different skills:
- `qa-wolf-skill-2.html` - Skill 2 testing
- `qa-wolf-skill-3.html` - Skill 3 for transfers
- `qa-wolf-skill-22.html` - Agent readiness testing
- `qa-wolf-skill-30.html` - Chat completion testing
- `qa-wolf-skill-59.html` - Chat limits testing

### Agent Accounts
Tests require multiple WebRTC agent accounts with different skills:
- `WEBRTCAGENT_3_EMAIL` - Primary chat agent
- `WEBRTCAGENT_25_EMAIL` & `WEBRTCAGENT_26_EMAIL` - Transfer testing
- `WEBRTCAGENT_44_EMAIL` - Chat limits testing
- Various other agents for specific scenarios

### Supervisor Account
- `SUPERVISOR_EMAIL` - For Cradle to Grave report verification

## Configuration

### Environment Variables Required
```bash
# Agent Accounts
WEBRTCAGENT_3_EMAIL=agent3@example.com
WEBRTCAGENT_25_EMAIL=agent25@example.com
WEBRTCAGENT_26_EMAIL=agent26@example.com
WEBRTCAGENT_44_EMAIL=agent44@example.com
# ... additional agent accounts

# Supervisor Account  
SUPERVISOR_EMAIL=supervisor@example.com

# Authentication
DEFAULT_PASSWORD=your_password_here
```

### Browser Configuration
Tests are configured to run with:
- Fake media stream devices for WebRTC
- Camera and microphone permissions
- Multiple browser contexts for multi-user scenarios

## Running Tests

### Individual Test Files
```bash
# Run specific test file
npx playwright test pom-tests/web_chats/create-a-web-chat.spec.ts

# Run with specific browser
npx playwright test pom-tests/web_chats/chat-transfer.spec.ts --project=chromium
```

### Complete Test Suite
```bash
# Run all web chat tests
npx playwright test pom-tests/web_chats/

# Run with specific configuration
npx playwright test pom-tests/web_chats/ --headed --slowMo=1000
```

### Parallel Execution
```bash
# Run tests in parallel (default)
npx playwright test pom-tests/web_chats/ --workers=4

# Run sequentially for debugging
npx playwright test pom-tests/web_chats/ --workers=1
```

## Common Test Patterns

### Agent Setup
```typescript
const webChatClient = new WebChatClient(page);
const { agentDash, agentName } = await webChatClient.setupAgentForChatTesting(
  agentCredentials,
  skillNumber,
  { cleanupExistingChats: true }
);
```

### Chat Session Creation
```typescript
const { blogPage, chatSession, customer } = await webChatClient.createWebChatSession(
  skillNumber,
  agentCredentials,
  customerData
);
```

### Message Exchange
```typescript
await blogPage.sendMessage('Customer message');
await chatSession.verifyReceivedMessage('Customer message');

await chatSession.sendMessage('Agent response');
await blogPage.verifyReceivedMessage('Agent response');
```

## Debugging

### Common Issues
1. **Agent Not Ready** - Verify agent status, skills, and channel enablement
2. **Chat Widget Not Loading** - Check blog page URL and network connectivity
3. **Message Delivery Delays** - Add appropriate wait times for real-time features
4. **Transfer Failures** - Ensure both agents have same skill and are available

### Debug Configuration
```typescript
// Enable slow motion for visual debugging
const webChatClient = new WebChatClient(page);
await page.setDefaultTimeout(30000);
await page.setDefaultNavigationTimeout(30000);
```

### Screenshot Capture
Tests include automatic screenshot capture on failures and can be manually triggered:
```typescript
await blogPage.takeScreenshot('debug-chat-state');
```

## Migration Notes

These tests have been migrated from the original JavaScript implementation with the following improvements:

1. **Type Safety** - Full TypeScript implementation with proper types
2. **Page Object Model** - Structured page objects for maintainability  
3. **Reusable Components** - Common workflows abstracted into API clients
4. **Better Error Handling** - Improved error messages and debugging info
5. **Consistent Patterns** - Standardized test structure and naming
6. **Enhanced Reliability** - Better wait strategies and element identification

### Original Test Mapping
- `create_a_web_chat.spec.js` → `create-a-web-chat.spec.ts`
- `chat_transfer.spec.js` → `chat-transfer.spec.ts` 
- `web_chats_agent_chat_limits.spec.js` → `web-chats-agent-chat-limits.spec.ts`
- `mark_agent_as_ready.spec.js` → `mark-agent-as-ready.spec.ts`
- `end_chat_and_log_out.spec.js` → `end-chat-and-log-out.spec.ts`
- Multiple status tests → `agent-status-management.spec.ts`
- Multiple queue tests → `chat-queue-management.spec.ts`

## Contributing

When adding new web chat tests:

1. Use existing page objects when possible
2. Follow established naming conventions
3. Include comprehensive test descriptions
4. Add environment variable documentation
5. Test both positive and negative scenarios
6. Include cleanup procedures for multi-agent tests

## Support

For issues with web chat testing:
1. Verify environment variables are set correctly
2. Check agent account availability and permissions
3. Ensure blog test pages are accessible
4. Review browser console for JavaScript errors
5. Check network connectivity to external blog sites
