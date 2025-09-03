import { logInSupervisor } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("web_rtc_agent_creation", async () => {
 // Step 1. Create WebRTC Agent (agent creation)
  //--------------------------------
  // Arrange:
  //--------------------------------
  //!! create a new mailbox and destructuring the new email address and its associated message listener function to {email} and {waitForMessage}
  const { emailAddress: email, waitForMessage } = await getInbox({ new: true });
  
  //!! login as a supervisor, destructuring the result to {context} and {page}
  const { browser, context, page } = await logInSupervisor({slowMo: 1500});
  
  //!! hover over the "user-management" icon
  await page.hover('[data-mat-icon-name="user-management"]');
  
  //!! click the "Agent Licensing" menu item
  await page.click(':text("Agent Licensing")');
  
  //!! ensure the page is on the agent license management URL
  await expect(page).toHaveURL(/agent-license-management/);
  
  //!! assign "Agent Creation" to {agentName} for the new agent
  const agentName = "Agent Creationer";
  
  //!! delete the user "Agent Creation" if it already exists in the system
  try {
    await page.waitForSelector("mat-row");
    await page.waitForTimeout(1000);
    await expect(
      page.locator(`mat-row:has-text("${agentName}")`)
    ).not.toBeVisible({ timeout: 3000 });
  } catch {
    await page.click(
      `[data-cy="user-license-management-user-cell"] button:near(:text("${agentName}")) >> nth=0`
    );
    await page.click('[mat-menu-item]:has-text("Delete")');
    await page.click('[data-cy="confirmation-dialog-okay-button"]');
  }
  
  //!! pause the process for 3 seconds
  await page.waitForTimeout(3000);
  
  //! ----
  
  //--------------------------------
  // Act:
  //--------------------------------
  
  //! Create a new "Agent Creation" with email and extension, assign licenses, and verify the creation
  
  //!! click the "Add Agent" button
  await page.click('button:has-text("Add Agent")');
  
  //!! fill the Name input field with {agentName}
  await page.fill('[placeholder="Add Name"]', agentName);
  
  //!! fill the email input field with {email}
  await page.fill('[placeholder="Add email"]', email);
  
  //!! fill the extension input field with "337"
  await page.fill('[placeholder="Add extension"]', "337");
  
  //!! get the current date and time, assign it to {after}
  const after = new Date();
  
  //!! click the "Save" button in the overlay container
  await page.click('.cdk-overlay-container button:has-text("Save")');
  
  //!! confirm the action by clicking the "Ok" button
  await page.click('button:has-text("Ok")');
  
  //!! verify if the newly created agent "Agent Creation" is visible in the table
  await expect(page.locator(`mat-row:has-text("${agentName}")`)).toBeVisible();
  
  //!! pause the process for 2 seconds
  await page.waitForTimeout(2000);
  
  //!! check if the "CCAAS_VOICE" license has been assigned to "Agent Creation"; if not assign it
  try {
    await expect(
      page.locator(
        '[role="row"]:has-text("Agent Creation") [data-cy="user-license-management-license-selection-CCAAS_VOICE"] input'
      )
    ).toBeChecked({ timeout: 5000 });
  } catch {
    await page.click(
      '[role="row"]:has-text("Agent Creation") [data-cy="user-license-management-license-selection-CCAAS_VOICE"] input',
      { force: true }
    );
  }
  
  //!! click on "user-license-management-save-button" to save the user license management
  await page.click('[data-cy="user-license-management-save-button"]');
  
  //!! pause the process for 3 seconds
  await page.waitForTimeout(3000);
  
  //!! click again on "user-license-management-save-button", catching errors if the button isn't available
  try {
    await page.click('[data-cy="user-license-management-save-button"]', {timeout: 5000});
  } catch (err) {
    console.log(err)
  }
  
  //!! pause the process for 10 seconds
  await page.waitForTimeout(10000);
  
  //! ----
  
  //--------------------------------
  // Assert:
  //--------------------------------
  console.log(email);
  //! Assert a welcome email is sent to the newly created user and assert link to set password
  
  //!! wait for a new message since {after} and assign the message to {message}
  const message = await waitForMessage({ after, timeout: 1000 * 60 * 4 });
  
  //!! check if the welcome message includes "Your account has been successfully created"
  expect(
    message.text.includes("Your account has been successfully created")
  ).toBe(true);
  
  //!! create a new page and assign it to {passwordPage}
  const passwordContext = await browser.newContext();
  const passwordPage = await passwordContext.newPage();
  
  //!! pause the process for 2 seconds before continuing
  await passwordPage.waitForTimeout(2000);
  
  //!! navigate to the first URL found in the welcome message
  await passwordPage.goto(message.urls[0]);
  console.log(message.urls)
  //!! check if the currently viewed page is for password reset
  await expect(passwordPage).toHaveURL(/password/);
  
  //!! generate a complex password with the help of faker library and assign it to {password}
  const password = faker.internet.password(12, false, null, "!1Aa");
  
  //!! fill the password input field with the generated {password}
  await passwordPage.fill("#psw", password);
  
  //!! fill the password confirmation input field with the same {password}
  await passwordPage.fill("#confirm-password", password);
  
  //!! pause the process for 5 seconds before continuing
  await page.waitForTimeout(5000);
  
  //!! click the "Set Password" button
  await passwordPage.click(".set-password-btn");
  
  //!! click "Back to main page"
  await passwordPage.click('button:has-text("Back to main page")');
  
  //!! ensure the user is redirected to the CC agent dashboard after password set
  await expect(passwordPage).toHaveURL(/ccagent/);
  
  //!! verify if "Agent Creation" is visible on the first locator with the class "name"
  await expect(passwordPage.locator(".name").first()).toHaveText(
    agentName
  );
  
  //!! close any optional pop-up modal
  try {
    await passwordPage.click(':text("Got it")');
  } catch (err) {
    console.log(err)
  }
  
  //!! click the agent status button
  await passwordPage.click('[data-cy="agent-status-menu-button"]');
  
  //!! click the log out button located in the agent status dropdown
  await passwordPage.click('[data-cy="agent-status-logout-link"]');
  
  //!! fill the username input field with {email}
  await passwordPage.fill('[data-cy="consolidated-login-username-input"]', email);
  
  //!! fill the password input field with {password}
  await passwordPage.fill(
    '[data-cy="consolidated-login-password-input"]',
    password
  );
  
  //!! click the "Log In" button
  await passwordPage.click(".login");
  
  //! ----
  
  // Clean up
  
  //! Delete newly created user, "Agent Creation", and log back in as supervisor
  
  //!! bring the login page to the front
  await page.bringToFront();
  
  //!! reload the page
  await page.reload();
  
  //!! pause the process for 2 seconds
  await page.waitForTimeout(2000);
  
  // //!! click the agent status button
  // await page.click('[data-cy="agent-status-menu-button"]');
  
  // //!! click the log out button located in the agent status dropdown
  // await page.click('[data-cy="agent-status-logout-link"]');
  
  // //!! pause the process for 2 seconds before continuing
  // await page.waitForTimeout(2000);
  
  // //!! navigate to {process.env.DEFAULT_URL}
  // await page.goto(process.env.DEFAULT_URL);
  
  // //!! fill the username input field with the supervisor username extracted from environment variables
  // await page.fill(
  //   '[data-cy="consolidated-login-username-input"]',
  //   process.env.SUPERVISOR_USERNAME
  // );
  
  // //!! fill the password input field with the supervisor password extracted from environment variables
  // await page.fill(
  //   '[data-cy="consolidated-login-password-input"]',
  //   process.env.SUPERVISOR_PASSWORD
  // );
  
  // //!! click the login button to log in as supervisor
  // await page.click('[data-cy="consolidated-login-login-button"]');
  
  //!! hover over the "user-management" icon
  await page.hover('[data-mat-icon-name="user-management"]');
  
  //!! click the "Agent Licensing" menu item
  await page.click(':text("Agent Licensing")');
  
  //!! click the delete button of the user "Agent Creation"
  await page.click(
    `[data-cy="user-license-management-user-cell"] button:near(:text("${agentName}")) >> nth=0`
  );
  
  //!! confirm the deletion by clicking the "Delete" button
  await page.click('[mat-menu-item]:has-text("Delete")');
  
  //!! confirm the action by clicking the "Okay" button
  await page.click('[data-cy="confirmation-dialog-okay-button"]');
  
  //!! pause the process for 3 seconds
  await page.waitForTimeout(3000);
  
  //!! verify if the user "Agent Creation" was successfully deleted
  await expect(
    page.locator(`mat-row:has-text("${agentName}")`)
  ).not.toBeVisible();
 // Step 2. Set Password (agent creation)
  //--------------------------------
  // Arrange:
  //--------------------------------
  
  
  
  //--------------------------------
  // Act:
  //--------------------------------
  
  
  
  //--------------------------------
  // Assert:
  //--------------------------------
  
  
  
 // Step 3. Log in as newly created WebRTC Agent (agent creation)
  //--------------------------------
  // Arrange:
  //--------------------------------
  
  
  
  //--------------------------------
  // Act:
  //--------------------------------
  
  
  
  //--------------------------------
  // Assert:
  //--------------------------------
  
  
  
 // Step 4. Delete WebRTC Agent (agent creation)
  //--------------------------------
  // Arrange:
  //--------------------------------
  
  
  
  //--------------------------------
  // Act:
  //--------------------------------
  
  
  
  //--------------------------------
  // Assert:
  //--------------------------------
  
  
  
});