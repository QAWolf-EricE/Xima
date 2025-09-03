import { logInSupervisor } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("web_rtc_reset_password_via_license_management", async () => {
 // Step 1. Send Reset Password Email as Supervisor
  //--------------------------------
  // Arrange:
  //--------------------------------
  //!! get the email inbox with id "webrtcagentpassword", and destructure the results to variables {email} and {waitForMessage}
  const {emailAddress: email, waitForMessage } = await getInbox({ address: "xima+webrtcresetpass@qawolf.email" });
  
  //! sign in as a Supervisor, navigate to the Agent Licensing page, prepare to reset password for an agent
  
  //!! log in as a supervisor with settings {slowMo: 500}, and destructure the results to variables {context} and {page}
  const { context, page } = await logInSupervisor({ slowMo: 500 });
  
  //!! hover over the element with specified data attribute
  await page.hover('[data-mat-icon-name="user-management"]');
  
  //!! click on the menu item "Agent Licensing"
  await page.click(':text("Agent Licensing")');
  
  //!! check if the page URL contains /agent-license-management/
  await expect(page).toHaveURL(/agent-license-management/);
  
  //!! click on the menu trigger in the row labeled "Reset Password Agent"
  await page.click(
    'mat-row:has-text(" WebRTC ResetPassword(555) ") [data-mat-icon-name="more-v1"]'
  );
  
  //!! click on the menu item "Edit"
  await page.click('[mat-menu-item]:has-text("Edit")');
  
  //!! set the current time to a variable called {after}
  const after = new Date();
  
  //!! click on the button to reset password
  await page.click('[data-unit="reset-password"]');
  await page.click('span:text-is("Ok")')
  
  //! ----
  
  
  //--------------------------------
  // Act:
  //--------------------------------
  
  //! Retrieve reset password email, create new password, sign out and sign back in
  
  //!! wait for an email to arrive that was sent after the time defined by variable {after}, save the email content to variable {message}
  const message = await waitForMessage({ after });
  
  //!! check if the email content contains the string "A request has been made to reset your account's password"
  expect(message.text).toContain(
    "A request has been made to reset your account's password"
  );
  
  //!! open a new page in the browser context, and assign it to a variable {passwordPage}
  const passwordPage = await context.newPage();
  
  //!! go to the first URL from the email content on the new page
  await passwordPage.goto(message.urls[0]);
  
  //!! check if the page URL contains /password/
  await expect(passwordPage).toHaveURL(/password/);
  
  //!! generate a random password and assign it to a variable {password}
  const password = faker.internet.password(12, false, null, "!1Aa");
  
  //!! fill in the new password in the password field
  await passwordPage.fill("#psw", password);
  
  //!! confirm the new password in the confirmation field
  await passwordPage.fill("#confirm-password", password);
  
  //!! click the button to set the new password
  await passwordPage.click(".set-password-btn");
  
  //!! click the button to go back to the main page
  await passwordPage.click('button:has-text("Back to main page")');
  
  //!! attempt to dismiss any popup message by clicking the confirmation button, with a timeout of 5 seconds
  try {
    await passwordPage.click('button:has-text("Got it")', { timeout: 5000 });
  } catch (err) {
    console.log(err)
  }
  
  //!! check if the page URL contains /ccagent/
  await expect(passwordPage).toHaveURL(/ccagent/);
  
  //!! click the button to open the agent status menu
  await passwordPage.click('[data-cy="agent-status-menu-button"]');
  
  //!! click the link to log out
  await passwordPage.click('[data-cy="agent-status-logout-link"]');
  
  //!! fill in the username field with the agent's email
  await passwordPage.fill('[data-cy="consolidated-login-username-input"]', email);
  
  //!! fill in the password field with the new password
  await passwordPage.fill(
    '[data-cy="consolidated-login-password-input"]',
    password
  );
  
  //!! click the login button
  await passwordPage.click(".login");
  
  //! ----
  
  
  //--------------------------------
  // Assert:
  //--------------------------------
  
  //! Verify successful login with new password
  
  //!! check if the page URL contains /ccagent/
  await expect(passwordPage).toHaveURL(/ccagent/);
  
  //!! expect the first instance of the ".name" locator to contain the text "WebRTC Reset Password Agent"
  await expect(passwordPage.locator(".name").first()).toHaveText(
    "WebRTC ResetPassword"
  );
  
  //! ----
  
  //! ----
  
  
 // Step 2. Reset Password as Agent
  // Description:
 // Step 3. Log in with new creds as Agent
  // Description:
});