import { logInSupervisor } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("rename_agent", async () => {
 // Step 1. Rename Agent
  //--------------------------------
  // Arrange:
  //--------------------------------
  //!! log in as a supervisor
  const { page } = await logInSupervisor({ slowMo: 500 });
  
  //!! verify that the Reports page is loaded
  await expect(page.locator('[translationset="HOME_TITLE"]')).toHaveText(
    "Reports"
  );
  
  //!! create a new email inbox for the agent
  const { emailAddress: email, waitForMessage } = await getInbox({ new: true });
  
  //!! navigate to Agent Licensing section
  await page.hover('[data-mat-icon-name="user-management"]');
  
  //!! click on "Agent Licensing"
  await page.locator(`:text("Agent Licensing")`).click();
  
  //!! verify that the URL contains "agent-license-management"
  await expect(page).toHaveURL(/agent-license-management/);
  
  //!! if an agent named "rename" exists, delete it
  try {
    await page.waitForSelector("mat-row");
    await page.waitForTimeout(1000);
    await expect(page.locator(`mat-row:has-text("rename")`)).not.toBeVisible({
      timeout: 3000,
    });
  } catch {
    await page.hover(
      `mat-row:has-text("rename") [data-cy="user-license-management-user-cell"] button`
    );
    await page.click(
      `mat-row:has-text("rename") [data-cy="user-license-management-user-cell"] button`
    );
    await page
      .locator(`[data-cy="user-license-management-delete-agent"]`)
      .click();
    await page.locator(`[data-cy="confirmation-dialog-okay-button"]`).click();
  }
  
  //!! wait for 3 seconds
  await page.waitForTimeout(3000);
  
  //!! click "Add Agent" button
  await page.click('button:has-text("Add Agent")');
  
  //!! fill the name field with "renameBefore"
  await page.fill('[placeholder="Add Name"]', "renameBefore");
  
  //!! fill the email field with the agent's {email}
  await page.fill('[placeholder="Add email"]', email);
  
  //!! fill the extension field with "2"
  await page.fill('[placeholder="Add extension"]', "2");
  
  //!! create a variable {after} with the current timestamp
  const after = new Date();
  
  //!! wait for 1 second
  await page.waitForTimeout(1000);
  
  //!! save the agent information
  await page.click('.cdk-overlay-container button:has-text("Save")');
  
  //!! wait for 1 second
  await page.waitForTimeout(1000);
  
  //!! Click 'Ok' to close the popup
  await page.click('button:has-text("Ok")');
  
  //!! wait for 1 second
  await page.waitForTimeout(1000);
  
  //!! verify that the new agent "renameBefore" is visible in the table
  await expect(page.locator(`mat-row:has-text("renameBefore")`)).toBeVisible();
  
  //!! wait for 2 seconds
  await page.waitForTimeout(2000);
  
  //!! ensure that the VOICE License checkbox for the agent "renameBefore" is checked
  if (
    !(await page
      .locator(
        '[role="row"]:has-text("renameBefore") [data-cy="user-license-management-license-selection-CCAAS_VOICE"] input'
      )
      .isChecked())
  ) {
    await page
      .locator(
        '[role="row"]:has-text("renameBefore") [data-cy="user-license-management-license-selection-CCAAS_VOICE"] input'
      )
      .check();
    await page
      .locator(
        '[role="row"]:has-text("renameBefore") [value="CCAAS_VOICE.CCAAS_WEB_CHAT_ADDON"]'
      )
      .click();
  }
  
  //!! click on the Save button
  await page.click('[data-cy="user-license-management-save-button"]');
  
  //!! wait for 3 seconds
  await page.waitForTimeout(3000);
  
  //!! attempt to click on the save button again
  try {
    await page
      .locator('[data-cy="user-license-management-save-button"]')
      .click({ timeout: 3000 });
  } catch (err) {
    console.log(err)
   }
  
  //!! wait for 10 seconds
  await page.waitForTimeout(10000);
  
  //!! wait for a new email message
  const message = await waitForMessage({ after });
  
  //!! verify the email message contains "Your account has been successfully created"
  expect(
    message.text.includes("Your account has been successfully created")
  ).toBe(true);
  
  //!! navigate to Agent Licensing section
  await page.hover('[data-cy="sidenav-menu-USER_MANAGEMENT"]');
  
  //!! click on "Agent Licensing"
  await page.click(':text("Agent Licensing")');
  
  //!! wait for 1 second
  await page.waitForTimeout(1000);
  
  //!! scroll to the agent "renameBefore" on the page
  await page
    .locator(
      '[data-cy="user-license-management-user-cell"]:has-text("renameBefore")'
    )
    .scrollIntoViewIfNeeded(); // failed here run lines 32 onward
  
  //! ----
  
  //--------------------------------
  // Act:
  //--------------------------------
  
  //! Edit the agent "renameBefore" to have the new name "renameAfter", and update its licenses and skills
  
  //!! hover over the agent entry "renameBefore(2)"
  await page.hover(
    '[data-cy="user-license-management-user-cell"]:has-text("renameBefore(2)")'
  );
  
  //!! click on the three dots button next to "renameBefore(2)"
  await page.click(
    '[data-cy="user-license-management-user-cell"]:has-text("renameBefore(2)") button'
  );
  
  //!! click on the Edit button
  await page.click('[data-cy="user-license-management-edit-agent"]');
  
  //!! wait for 2 seconds
  await page.waitForTimeout(2000);
  
  //!! enter the new name "renameAfter" for the agent
  await page.locator('[placeholder="Add Name"]').fill("renameAfter");
  
  //!! click Save to update the agent information
  await page.locator('[data-unit="save"]').click();
  
  //!! click Ok to close the popup
  await page.locator('.cdk-dialog-container button:has-text("Ok")').click();
  
  //!! scroll the renamed agent "renameAfter(2)" into view if needed
  await page
    .locator(
      '[data-cy="user-license-management-user-cell"]:has-text("renameAfter(2)")'
    )
    .scrollIntoViewIfNeeded();
  
  await page.waitForTimeout(3000);
  
  //!! make sure that the VOICE License checkbox for the updated agent "renameAfter" is checked
  if (
    !(await page
      .locator(
        '[role="row"]:has-text("renameAfter") [data-cy="user-license-management-license-selection-CCAAS_VOICE"] input'
      )
      .isChecked())
  ) {
    await page
      .locator(
        '[role="row"]:has-text("renameAfter") [data-cy="user-license-management-license-selection-CCAAS_VOICE"] input'
      )
      .check();
    await page
      .locator(
        '[role="row"]:has-text("renameAfter") [value="CCAAS_VOICE.CCAAS_WEB_CHAT_ADDON"]'
      )
      .click();
  }
  
  //! ----
  
  //--------------------------------
  // Assert:
  //--------------------------------
  
  //! Confirm that the agent name, licenses, and skills have been updated correctly
  
  //!! verify that the agent name "renameAfter(2)" is displayed
  await expect(page.locator("text=renameAfter(2)")).toBeVisible(); // Agent Licensing page
  
  //!! click Save to update the agent permissions
  await page.locator('[data-cy="user-license-management-save-button"]').click();
  
  //!! wait for 5 seconds
  await page.waitForTimeout(5000);
  
  //!! navigate to Skill Levels page
  await page.hover('[data-cy="sidenav-menu-CONTACT_CENTER"]');
  
  //!! click on "Skill Levels"
  await page.click(':text("Skill Levels")');
  
  // search for agent
  await page.locator(`[placeholder="Search Agents..."]`).fill(`renameAfter`);
  
  //!! verify that the updated agent name "renameAfter(2)" is displayed
  await expect(page.locator("text=renameAfter(2)")).toBeVisible();
  
  //!! log the agent's {email}
  console.log(email);
  
  //!! launch a new browser and page for password setting
  const { context: passwordContext } = await launch();
  
  //!! create a new page in the password setting context
  const passwordPage = await passwordContext.newPage();
  
  //!! wait for 2 seconds
  await passwordPage.waitForTimeout(2000);
  
  //!! go to the password setting URL from the welcome email
  await passwordPage.goto(message.urls[0]);
  
  //!! verify that the URL contains /password/
  await expect(passwordPage).toHaveURL(/password/);
  
  //!! generate a secure password
  const password = faker.internet.password(12, false, null, "!1Aa");
  
  //!! fill the password field with the generated password
  await passwordPage.type("#psw", password, { delay: 50 });
  
  //!! fill the confirm password field with the generated password
  await passwordPage.type("#confirm-password", password, { delay: 50 });
  
  //!! click the "Set Password" button
  await passwordPage.click(".set-password-btn");
  
  //!! wait for 2 seconds
  await passwordPage.waitForTimeout(2000);
  
  //!! click "Back to main page" button
  await passwordPage.click('button:has-text("Back to main page")');
  
  //!! verify that the URL contains /ccagent/
  await expect(passwordPage).toHaveURL(/ccagent/);
  
  //!! verify that the new agent name "renameAfter" is displayed
  await expect(passwordPage.locator(".name").first()).toHaveText("renameAfter");
  
  //!! try to click "Got it" button if present
  try {
    await passwordPage.click(':text("Got it")');
  } catch (err) {
    console.log(err)
   }
  
  //!! open the login menu
  await passwordPage.click('[data-cy="agent-status-menu-button"]');
  
  //!! click on Logout button
  await passwordPage.click('[data-cy="agent-status-logout-link"]');
  
  //!! fill the username field with the agent's {email}
  await passwordPage.fill('[data-cy="consolidated-login-username-input"]', email);
  
  //!! fill the password field with the generated password
  await passwordPage.fill(
    '[data-cy="consolidated-login-password-input"]',
    password
  );
  
  await passwordPage.keyboard.press('Tab');
  
  //!! click on the login button
  await expect(passwordPage.locator(".login")).toBeEnabled({timeout: 20000});
  await passwordPage.locator(".login").click();
  
  //!! log the agent's {email} and password
  console.log(email, password);
  
  //!! verify that the updated agent name "renameAfter" is displayed after login
  await expect(passwordPage.locator("text=renameAfter")).toBeVisible();
  
  //!! open the status menu
  await passwordPage.locator('[data-cy="agent-status-menu-button"]').click();
  
  //!! click logout to log out of the agent account
  await passwordPage.locator('[data-cy="agent-status-logout-link"]').click();
  
  //!! close the password setting page
  await passwordPage.close();
  
  //! ----
  
  // Cleanup
  
  //! Delete the renamed agent and save the test state
  
  //!! navigate to Agent Licensing section
  await expect(async () => {
    await page.hover('[data-mat-icon-name="user-management"]');
  
    //!! click on "Agent Licensing"
    await page.click(':text-is("Agent Licensing")');
    await page
      .locator(
        'xima-user-license-management-translation:text-is("Agent Licensing")'
      )
      .waitFor();
  }).toPass({ timeout: 1000 * 120 });
  
  //!! hover over the edited user "renameAfter"
  await page.hover(
    `mat-row:has-text("renameAfter") [data-cy="user-license-management-user-cell"]`
  );
  
  //!! click on the three dots button next to the agent "renameAfter"
  await page.click(
    `mat-row:has-text("renameAfter") [data-mat-icon-name="more-v1"]`
  );
  
  //!! click on "Delete" button
  await page.click('[mat-menu-item]:has-text("Delete")');
  
  //!! confirm the deletion by clicking on 'Okay' button
  await page.click('[data-cy="confirmation-dialog-okay-button"]');
  
  //!! wait for 3 seconds
  await page.waitForTimeout(3000);
  
  //!! confirm that the deleted agent "renameAfter" is not visible
  await expect(page.locator(`mat-row:has-text("renameAfter")`)).not.toBeVisible();
  
 // Step 2. Log In with Renamed Agent
  //--------------------------------
  // Arrange:
  //--------------------------------
  
  
  
  //--------------------------------
  // Act:
  //--------------------------------
  
  
  
  //--------------------------------
  // Assert:
  //--------------------------------
  
  
  
 // Step 3. Delete renamed agent
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