import { logInWebRTCAgent, toggleSkill, toggleStatusOn } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("mark_agent_as_busy", async () => {
 // Step 1. Log In with Agent (Skill 2) for Blog Spot (mark agent as busy)
  //--------------------------------
  // Arrange:
  //--------------------------------
  
  // Login using WEBRTCAGENT_8_EMAIL ( WF previously used "xima+f200h6f@qawolf.email" )
  const { context, page } = await logInWebRTCAgent(
    process.env.WEBRTCAGENT_8_EMAIL,
    {
      args: [
        "--use-fake-ui-for-media-stream",
        "--use-fake-device-for-media-stream",
      ],
      permissions: ["microphone", "camera"],
      slowMo: 1000,
    },
  );
  
  // Toggle on "Skill 62"
  await toggleSkill(page, "62");
  
  // Toggle status on
  await toggleStatusOn(page);
  
  //--------------------------------
  // Act:
  //--------------------------------
  
  // Create a new page to start a chat
  const blogPage = await context.newPage();
  
  // Navigate to the blog page
  await blogPage.goto(
    "https://chattestxima.blogspot.com/2024/12/qa-wolf-skill-62.html",
  );
  
  // Click the chat widget icon
  await blogPage.locator(`#xima-chat-widget-icon-chat`).click();
  
  //--------------------------------
  // Assert:
  //--------------------------------
  
  // Assert "Skill 62 - Chat with an Agent" is visible
  await expect(blogPage.getByText("Skill 62 - Chat with an Agent")).toBeVisible();
  
  // Assert the name input field is visible
  await expect(blogPage.locator("#xima-chat-name")).toBeVisible();
  
  // Assert the email address input field is visible
  await expect(blogPage.locator("#xima-chat-email")).toBeVisible();
  
 // Step 2. Set Agent as DND (mark agent as busy)
  //--------------------------------
  // Arrange:
  //--------------------------------
  
  // Pull the first page back up
  await page.bringToFront();
  
  //--------------------------------
  // Act:
  //--------------------------------
  
  // Click on the agent's "Chevron" menu button
  await page
    .locator(
      '[mat-ripple-loader-class-name="mat-mdc-button-ripple"]:has([data-mat-icon-name="chevron-closed"])',
    )
    .click();
  
  // Click on the "Lunch" menu option
  await page.getByRole(`menuitem`, { name: `Lunch` }).click();
  
  //--------------------------------
  // Assert:
  //--------------------------------
  
  // Assert the status is updated
  await expect(page.locator(`.dnd-status-container`)).toHaveText("Lunch");
  
  // Bring the blog page back into view
  await blogPage.bringToFront();
  
  // Refresh the page
  await blogPage.reload();
  
  // Click the chat widget icon
  await blogPage.locator(`#xima-chat-widget-icon-chat`).click();
  
  // Assert the widget's text states that all agents are busy
  await expect(blogPage.getByText("All agents are currently busy")).toBeVisible();
  
  // Assert the page asks if the user wants to join the "Chat Queue"
  await expect(
    blogPage.getByText(`Would you like to be placed in the Chat Queue?`),
  ).toBeVisible();
  
});