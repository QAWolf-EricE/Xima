import { endWebChat, logInWebRTCAgent, toggleSkill, toggleStatusOn } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("send_second_chat_into_queue", async () => {
 // Step 1. Log In with Agent (Skill 2) for Blog Spot (send second chat into queue)
  //--------------------------------
  // Arrange:
  //--------------------------------
  // REQ 01 Log in with agent (Skill 60) for blog spot
  const {
    browser,
    context,
    page: agentPage,
  } = await logInWebRTCAgent(process.env.WEBRTCAGENT_9_EMAIL, {
    args: [
      "--use-fake-ui-for-media-stream",
      "--use-fake-device-for-media-stream",
    ],
    permissions: ["microphone", "camera"],
    slowMo: 1000,
  });
  
  // Navigate to Blog Spot
  const { browser: browser2, context: context2 } = await launch();
  const blogPage = await context2.newPage();
  await blogPage.goto(
    "https://chattestxima.blogspot.com/2024/10/qa-wolf-skill-60.html"
  );
  
  // REQ 03 Create second web chat
  const { browser: browser3, context:context3 } = await launch();
  const secondBlogPage = await context3.newPage();
  await secondBlogPage.goto(
    "https://chattestxima.blogspot.com/2024/10/qa-wolf-skill-60.html"
  );
  
  // Bring page to front
  await agentPage.bringToFront()
  
  // Disable all skills except for 60
  await toggleSkill(agentPage, "60");
  
  // Set Agent to Ready
  await toggleStatusOn(agentPage)
  
  // Clenaup - accept any previousweb chats
  await endWebChat(agentPage);
  
  await blogPage.bringToFront()
  await blogPage.waitForTimeout(4000);
  await blogPage.reload();
  
  //--------------------------------
  // Act:
  //--------------------------------
  // REQ 02 Create web chat
  // Click on the Chat box
  try {
    await blogPage.locator(`#xima-chat-header`).click({timeout: 5000});
    await blogPage.locator(`#xima-start-chat-btn`).click();
  } catch {
    await blogPage.locator(`#xima-chat-widget-icon-chat`).click();
  }
  
  // Click yes to join queue if needed
  try {
    await blogPage.getByRole(`button`, { name: `Yes` }).click({ timeout: 5000 });
  } catch (err) {
    console.error(err);
  }
  
  // Fill the 'Name' input
  const customerOneName = faker.random.words(2);
  console.log(customerOneName);
  await blogPage.fill("#xima-chat-name", customerOneName);
  
  // Fill the 'Email' input
  const customerOneEmail = customerOneName.replace(/[ ]/g, "") + "@qawolf.email";
  console.log(customerOneEmail);
  await blogPage.fill("#xima-chat-email", customerOneEmail);
  
  // Click the Submit button
  await blogPage.click("#xima-chat-name-email-entry-submit");
  
  // Assert You Are in the Queue message on blog
  await expect(async () => {
    await expect(blogPage.locator("text=You Are In The Queue")).toBeVisible({
      timeout: 3000,
    });
  }).toPass({ timeout: 1000 * 240 });
  
  // Assert Agent gets Chat Offer
  await agentPage.bringToFront();
  await expect(agentPage.locator("text=Chat Offer")).toBeVisible({
    timeout: 2 * 60 * 1000,
  });
  
  // Have Chat ongoing with Agent
  await agentPage.click('[data-cy="alert-chat-offer-accept"]'); // accept
  
  // Navigate to Blog Spot
  await secondBlogPage.bringToFront()
  await secondBlogPage.waitForTimeout(4000);
  await secondBlogPage.reload();
  
  // REQ 02 Create web chat
  // Click on the Chat box
  try {
    await secondBlogPage.locator(`#xima-chat-header`).click({timeout: 5000});
  // Click the 'Yes' button
  try {
    await secondBlogPage.click("#xima-enter-chat-queue-btn");
  } catch {
    await secondBlogPage.click("#xima-start-chat-btn");
  }
  } catch {
    await secondBlogPage.locator(`#xima-chat-widget-icon-chat`).click();
  }
  
  // click yes if necessary
  try {
    await secondBlogPage.getByRole(`button`, { name: `Yes` }).click();
  } catch (err) {
    console.error(err);
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
  // User
  // - Sees 'You Are in the Queue' message on blog
  await expect(secondBlogPage.locator("text=You Are In The Queue")).toBeVisible();
  
  // - Sees 'Your Estimated Wait Time is:' on blog
  await expect(
    secondBlogPage.locator("text=Estimated Wait Time")
  ).toBeVisible();
  
  // Agent
  // - Can see new chat with name under 'Active Media'
  await agentPage.bringToFront();
  await expect(
    agentPage.locator(
      `:text-is("${customerOneName}"):below(:text("Active Media"))`
    )
  ).toBeVisible();
  
  //--------------------------------
  // Cleanup:
  //--------------------------------
  // Navigate to Blog Spot
  await blogPage.bringToFront();
  
  // REQ 04 End web chat as a user
  // Click the 'X' button on chat
  await blogPage.click("#xima-chat-widget-icon-x");
  
  // Click the 'Yes' button on modal
  await blogPage.click(`#xima-end-chat-end`);
  
  // Assert:
  // User
  // - Chat has ended message
  await expect(blogPage.locator(`.xima-message-content`)).toHaveText(
    "Chat Ended"
  );
  
  // Assert:
  // Agent
  // - Chat Ended message
  await agentPage.bringToFront();
  await expect(agentPage.locator("text=Messaging Ended")).toBeVisible();
  
  // Click the 'Finish' button on CCAC Agent page
  await agentPage
    .locator('[data-cy="call-details-finish-anchor"]')
    .click({ delay: 500, force: true });
  
 // Step 2. Create Web Chat (send second chat into queue)
  // Arrange:
  // Navigate to Blog Spot
  
  // Act:
  // Click the Chat box
  // Click the 'Yes' button
  // Fill the 'Name' input
  // Fill the 'Email' input
  // Click the Submit button
  
  // Assert:
  // You Are in the Queue message on blog
  // Agent gets Chat Offer
  
 // Step 3. Create Second Web Chat (send second chat into queue)
  // Arrange:
  // Have Chat ongoing with Agent
  // Navigate to Blog Spot 
  
  // Act:
  // Click the Chat box
  // Click the 'Yes' button
  // Fill the 'Name' input
  // Fill the 'Email' input
  // Click the Submit button
  
  // Assert:
  // User
  // - Sees 'You Are in the Queue' message on blog
  // - Sees 'Your Estimated Wait Time is:' on blog
  // Agent
  // - Can see new chat with name under 'Active Media'
  
 // Step 4. End Web Chat as a User (send second chat into queue)
  // Arrange:
  // Navigate to Blog Spot 
  
  // Act:
  // Click the 'X' button on chat
  // Click the 'Yes' button on modal
  // Click the 'Finish' button on CCAC Agent page
  
  // Assert:
  // User
  // - Chat has ended message
  // Agent
  // - Chat Ended message
  
});