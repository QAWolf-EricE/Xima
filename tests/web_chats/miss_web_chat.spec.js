import { logInWebRTCAgent, toggleSkill, toggleStatusOn } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("miss_web_chat", async () => {
 // Step 1. Log In with Agent (Skill 2) for Blog Spot (miss web chat)
  //--------------------------------
  // Arrange:
  //--------------------------------
  //!! log in as WebRTC agent with skill 17
  const { browser, context, page } = await logInWebRTCAgent(
    process.env.WEBRTCAGENT_35_EMAIL,
    {
      args: [
        "--use-fake-ui-for-media-stream",
        "--use-fake-device-for-media-stream",
      ],
      permissions: ["microphone", "camera"],
      slowMo: 1000,
    }
  );
  
  //!! click the "Got it" button if visible with a timeout of 5 seconds
  await page.bringToFront()
  try {
    await page.click(':text("Got it")', { timeout: 5 * 1000 });
  } catch (err) { 
    console.log(err)
  }
  
  //!! disable skill 17
  await toggleSkill(page, "17");
  
  //!! toggle the agent's status to 'ready'
  await toggleStatusOn(page);
  
  // Toggle off all channels aside from chat
  await page.locator(`.ready [data-mat-icon-name="voice"]`).click();
  await page.locator(`.ready [data-mat-icon-name="email"]`).click();
  await expect(page.locator(`.channels-disabled [data-mat-icon-name="voice"]`)).toBeVisible();
  await expect(page.locator(`.channels-disabled [data-mat-icon-name="email"]`)).toBeVisible();
  
  //!! wait 5 seconds before navigating
  await page.waitForTimeout(5 * 1000);
  
  //!! initiate a new page for the blog
  const blogPage = await context.newPage();
  
  //!! navigate to the specific blog page
  await blogPage.goto(
    "https://chattestxima.blogspot.com/2024/05/qa-wolf-skill-17.html"
  );
  
  //--------------------------------
  // Act:
  //--------------------------------
  //!! click the chat box header to open the chat dialog
  await blogPage.click("#xima-chat-widget-icon-chat");
  
  //!! generate a random 2-word name for the customer
  const customerName = faker.random.words(2);
  
  //!! print the generated customer name to the console for debugging
  console.log(customerName);
  
  //!! fill the 'Name' field with the generated customer name
  await blogPage.fill("#xima-chat-name", customerName);
  
  //!! generate a unique email address for the customer using the generated name
  const customerEmail = customerName.replace(/[ ]/g, "") + "@qawolf.email";
  
  //!! print the generated customer email to the console for debugging
  console.log(customerEmail);
  
  //!! fill the 'Email' field with the generated email address
  await blogPage.fill("#xima-chat-email", customerEmail);
  
  //!! click the 'Submit' button to submit the chat request
  await blogPage.click("#xima-chat-name-email-entry-submit");
  
  //!! expect the text "You Are In The Queue" to be visible on the blog page to confirm request submission
  await expect(blogPage.locator("text=You Are In The Queue")).toBeVisible();
  
  //!! bring the agent page to the front of the display
  await page.bringToFront();
  
  //!! wait for 10 seconds for elements to load
  await page.waitForTimeout(10 * 1000);
  
  //!! expect the text "Chat Offer" to be visible on the agent page, indicating a chat request
  await expect(page.locator("text=Chat Offer")).toBeVisible();
  
  //!! expect the customer email to be visible among the chat offers on the agent page
  await expect(page.locator(`span:text("${customerEmail}")`)).toBeVisible();
  
  //!! wait for 30 seconds to allow the chat offer to time out
  await page.waitForTimeout(30 * 1000);
  
  //--------------------------------
  // Assert:
  //--------------------------------
  //!! expect the text "Missed Chat Timeout" to be visible on the agent page, indicating the chat offer has timed out
  await expect(page.locator(`:text("Missed Chat Timeout")`)).toBeVisible();
  
  //!! expect the text "Chat Offer" to be no longer visible on the agent page
  await expect(page.locator(':text-is("Chat Offer")')).not.toBeVisible();
  
  //!! expect the customer email to be no longer visible among the chat offers on the agent page
  await expect(page.locator(`span:text("${customerEmail}")`)).not.toBeVisible();
  
  //!! click on the 'after-call-work-done' button
  await page.click(
  
    //!! accept the chat offer
    '[data-cy="active-media-tiles-container"] [data-cy="alert-after-call-work-done"]'
  
    //!! end the chat
  );
  
  //!! click the 'call-details-finish-anchor' button
  await page.click('[data-cy="alert-chat-offer-accept"]');
  await page.click('[data-cy="end-chat"]');
  await page.click('[data-cy="call-details-finish-anchor"]');
  
  
 // Step 2. Create Web Chat (miss web chat)
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
  
 // Step 3. Miss Chat Offer (miss web chat)
  // Arrange:
  //* After test, Accept chat and End it. Otherwise, it'll keep pinging
  
  // Act:
  // Wait 30 seconds
  
  // Assert:
  // Missed Chat Timeout message appears on Agent Page
  
});