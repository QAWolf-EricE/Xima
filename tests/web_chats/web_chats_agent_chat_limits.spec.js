import { endWebChat, logInWebRTCAgent, toggleSkill, toggleStatusOn } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("web_chats_agent_chat_limits", async () => {
 // Step 1. Log In with Agent (Skill 6) for Blog Spot (agent chat limits)
  //--------------------------------
  // Arrange:
  //--------------------------------
  // Login with Agent 44
  // Login
  //  - Fill the Username input with WEBRTC_AGENT Email
  //  - Fill the Password input with DEFAULT_PASSWORD
  //  - Click the 'Login' button
  // Navigate to https://chattestxima.blogspot.com/2024/10/qa-wolf-skill-59.html
  //  - Set Agent to Ready
  //  - Disable all skills except for 59
  //  - Navigate to Blog Spot
  //  - Click on the Chat box
  
  const { browser: blogbrowser, context } = await launch();
  const blogPage = await context.newPage();
  
  // REQ 01 Log in with agent (Skill 59) for Blog spot
  const {
    browser: agentBrowser,
    page: agentPage,
  } = await logInWebRTCAgent(process.env.WEBRTCAGENT_44_EMAIL, {
    args: [
      "--use-fake-ui-for-media-stream",
      "--use-fake-device-for-media-stream",
    ],
    permissions: ["microphone", "camera"],
    slowMo: 1000,
  });
  
  const { browser: secondBlogBrowser, context: context2 } = await launch();
  const secondBlogPage = await context2.newPage();
  
  const { browser: thirdBlogBrowser, context:context3 } = await launch();
  const thirdBlogPage = await context3.newPage();
  
  // Navigate to https://chattestxima.blogspot.com/2024/10/qa-wolf-skill-59.html
  await blogPage.bringToFront()
  await blogPage.goto(
    "https://chattestxima.blogspot.com/2024/10/qa-wolf-skill-59.html"
  );
  
  // Clean up existing active chats
  await agentPage.bringToFront()
  await agentPage.waitForTimeout(5000);
  let activeChatCount = await agentPage
    .locator('[data-cy="active-media-chat-email"]')
    .count();
  let attempts = 0;
  while (activeChatCount && attempts < 5) {
    await agentPage.click(`[data-cy="active-media-chat-email"]`);
    await agentPage
      .locator('div:text-is("Mark as Complete")')
      .or(agentPage.locator('[data-cy="end-chat"]'))
      .click();
    await agentPage.waitForTimeout(2000);
    activeChatCount = await agentPage
      .locator('[data-cy="active-media-chat-email"]')
      .count();
    attempts += 1;
  }
  
  // Set Agent to Ready
  try {
    await toggleStatusOn(agentPage);
  } catch {
    await expect(agentPage.locator(`:text('Ready')`)).toBeVisible();
  }
  
  // Disable all skills except for 59
  await toggleSkill(agentPage, "59");
  
  // accept any previous web chats
  await endWebChat(agentPage);
  
  // Navigate to Blog Spot
  await blogPage.bringToFront();
  await blogPage.waitForTimeout(3000);
  await blogPage.reload();
  
  //--------------------------------
  // Act:
  //--------------------------------
  // REQ 02 Create 2 web chats
  // Click on the Chat box
  await blogPage.waitForSelector('.post-title.entry-title:has-text("QA Wolf - Skill 59")', {
    timeout: 1000 * 240,
  });
  await blogPage.click("#xima-chat-widget-icon-chat");
  
  // Click the 'Yes' button to join queue
  try {
    await blogPage.getByRole(`button`, { name: `Yes` }).click({ timeout: 5000 });
  } catch {
    console.log(`No yes button`)
  }
  
  // Fill the 'Name' input
  const customerName = faker.random.words(2);
  await blogPage.fill("#xima-chat-name", customerName);
  
  // Fill the 'Email' input
  const customerEmail = customerName.replace(/[ ]/g, "") + "@qawolf.email";
  console.log(customerEmail);
  await blogPage.fill("#xima-chat-email", customerEmail);
  
  // Click the Submit button
  await blogPage.click("#xima-chat-name-email-entry-submit", { delay: 2000 });
  
  //--------------------------------
  // Assert:
  //--------------------------------
  // Assert Agent gets 1 Chat offer at a time
  await agentPage.bringToFront();
  await expect(
    agentPage.locator(
      `:text-is("${customerName}"):below(:text("Active Media")) >> nth=0`
    )
  ).toBeVisible({ timeout: 45 * 1000 });
  
  
  //--------------------------------
  // Act:
  //--------------------------------
  // Navigate to Blog Spot on different context
  await secondBlogPage.bringToFront()
  await secondBlogPage.goto(
    "https://chattestxima.blogspot.com/2024/10/qa-wolf-skill-59.html"
  );
  
  await secondBlogPage.waitForTimeout(4000);
  await secondBlogPage.reload();
  
  // Click on the Chat box
  await secondBlogPage.click("#xima-chat-widget-icon-chat");
  
  // Click the 'Yes' button to join queue
  try {
    await secondBlogPage.click("#xima-start-chat-btn", { timeout: 5000 });
  } catch {
    await secondBlogPage.click("#xima-enter-chat-queue-btn");
  }
  
  // Fill the 'Name' input
  const customerTwoName = faker.random.words(2);
  console.log(customerTwoName);
  await secondBlogPage.fill("#xima-chat-name", customerTwoName);
  
  // Fill the 'Email' input
  const customerTwoEmail = customerTwoName.replace(/[ ]/g, "") + "@qawolf.email";
  console.log(customerTwoEmail);
  await secondBlogPage.fill("#xima-chat-email", customerTwoEmail);
  
  // Click the Submit button
  await secondBlogPage.click("#xima-chat-name-email-entry-submit");
  
  //--------------------------------
  // Assert:
  //--------------------------------
  // Assert Agent gets 1 Chat offer at a time
  await agentPage.bringToFront();
  await expect(
    agentPage.locator(
      `:text-is("${customerName}"):below(:text("Active Media")) >> nth=0`
    )
  ).toBeVisible();
  console.log(customerName, customerTwoName);
  
  //--------------------------------
  // Act:
  //--------------------------------
  // Navigate to Agent CCAC
  await agentPage.bringToFront();
  // await agentPage.getByLabel(`Lunch`).click();
  // await agentPage.getByRole(`button`, { name: `Select` }).click();
  
  // REQ 03 Accept multiple chat sessions
  // Click the 'Accept' button for chat 1
  await agentPage.click('[data-cy="alert-chat-offer-accept"]'); // accept
  
  // Assert Agent is able to accept these chat sessions
  await expect(agentPage.locator(':text("Customer Details")')).toBeVisible();
  
  // Click the 'Accept' button for chat 2
  await agentPage.click('[data-cy="alert-chat-offer-accept"]'); // accept
  
  //--------------------------------
  // Assert:
  //--------------------------------
  // Assert Agent is able to accept these chat sessions
  await agentPage.click(
    `[data-cy="active-media-chat-username"] :text("${customerTwoName}")`
  );
  
  //--------------------------------
  // Act:
  //--------------------------------
  // Have chat 1 from hitting max chat session
  // Navigate to Blog Spot
  await thirdBlogPage.bringToFront()
  await thirdBlogPage.goto(
    "https://chattestxima.blogspot.com/2024/10/qa-wolf-skill-59.html"
  );
  
  await thirdBlogPage.waitForTimeout(4000);
  await thirdBlogPage.reload();
  
  // REQ 04 Create over the max chat session
  // Click on the Chat box
  await thirdBlogPage.click("#xima-chat-widget-icon-chat");
  
  // Click the 'Yes' button to join queue
  try {
    await thirdBlogPage.click("#xima-start-chat-btn", { timeout: 5000 });
  } catch {
    await thirdBlogPage.click("#xima-enter-chat-queue-btn");
  }
  
  // Fill the 'Name' input
  const customerThreeName = faker.random.words(2);
  console.log(customerThreeName);
  await thirdBlogPage.fill("#xima-chat-name", customerThreeName);
  
  // Fill the 'Email' input
  const customerThreeEmail =
    customerThreeName.replace(/[ ]/g, "") + "@qawolf.email";
  console.log(customerThreeEmail);
  await thirdBlogPage.fill("#xima-chat-email", customerThreeEmail);
  
  // Click the Submit button
  await thirdBlogPage.click("#xima-chat-name-email-entry-submit");
  
  //--------------------------------
  // Assert:
  //--------------------------------
  // Assert users see all agents are busy in chatbox with max chats being hit
  await expect(thirdBlogPage.locator("text=You Are In The Queue")).toBeVisible();
  await agentPage.bringToFront();
  
  
  //--------------------------------
  // Cleanup:
  //--------------------------------
  // Clean up emails
  let emailCount = await agentPage
    .locator('[data-mat-icon-name="active-media-email"]')
    .count();
  attempts = 0;
  while (emailCount && attempts < 5) {
    await agentPage.click(`[data-mat-icon-name="active-media-email"]`);
    await agentPage.click('div:text-is("Mark as Complete")');
    await agentPage.waitForTimeout(2000);
    emailCount = await agentPage
      .locator('[data-mat-icon-name="active-media-email"]')
      .count();
    attempts += 1;
  }
  
  await expect(agentPage.locator('[data-cy="active-media-tile"]')).toHaveCount(2);
  await expect(
    agentPage.locator('[data-cy="alert-chat-offer-accept"]')
  ).not.toBeVisible();
  
  // clean up - end both chats
  await agentPage.click(
    `:text-is("${customerName}"):below(:text("Active Media")) >> nth=0`
  );
  await agentPage.click('[data-cy="end-chat"]');
  await agentPage.click('[data-cy="call-details-finish-anchor"]');
  await agentPage.waitForTimeout(1000);
  await agentPage
    .locator(
      `:text-is("${customerTwoName}"):below(:text("Active Media")) >> nth=0`
    )
    .click({ timeout: 60000 });
  await agentPage.click('[data-cy="end-chat"]');
  await agentPage.click('[data-cy="call-details-finish-anchor"]');
  
  await agentPage.locator('[mat-ripple-loader-class-name="mat-mdc-button-ripple"]:has([data-mat-icon-name="chevron-closed"])').click();
  await agentPage.getByRole(`menuitem`, { name: `Lunch` }).click();
  
  
 // Step 2. Create 2 Web Chats (agent chat limits)
  // Arrange:
  // Navigate to Blog Spot
  
  // Act:
  // Click the Chat box
  // Click the 'Yes' button
  // Fill the 'Name' input
  // Fill the 'Email' input
  // Click the Submit button
  // Navigate to Blog Spot on different context
  // Click the Chat box
  // Click the 'Yes' button
  // Fill the 'Name' input
  // Fill the 'Email' input
  // Click the Submit button
  
  // Assert:
  // Agent gets 1 Chat offer at a time
  
 // Step 3. Accept multiple Chat sessions (agent chat limits)
  // Arrange:
  // Navigate to Agent CCAC
  
  // Act:
  // Click the 'Accept' button for chat 1
  // Click the 'Accept' button for chat 2
  
  // Assert:
  // Agent is able to accept these chat sessions
  
 // Step 4. Create over the max chat session (agent chat limits)
  // Arrange:
  // Have chat 1 from hitting max chat session
  // Navigate to Blog Spot
  
  // Act:
  // Click the Chat box
  // Click the 'Yes' button
  // Fill the 'Name' input
  // Fill the 'Email' input
  // Click the Submit button
  
  // Assert:
  // Users see all agents are busy in chatbox with max chats being hit
  
});