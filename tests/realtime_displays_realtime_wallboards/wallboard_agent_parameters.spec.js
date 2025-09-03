import { buildUrl, logInSupervisor } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("wallboard_agent_parameters", async () => {
 // Step 1. Create wallboard with agent param
  //--------------------------------
  // Arrange:
  //--------------------------------
  //!! Log in as a supervisor
  const { page, browser } = await logInSupervisor({
    slowMo: 500,
  
    args: [
      "--use-fake-ui-for-media-stream",
      "--use-fake-device-for-media-stream",
    ],
    permissions: ["microphone", "camera"],
  });
  
  //!! Verify that "Reports" is visible on the page
  await expect(page.locator('[translationset="HOME_TITLE"]')).toHaveText(
    "Reports"
  );
  
  //!! Hover over the sidenav menu "REALTIME_DISPLAYS"
  await page.hover('[data-cy="sidenav-menu-REALTIME_DISPLAYS"]');
  
  //!! Click "Realtime Wallboards"
  await page.click(':text("Realtime Wallboards")');
  
  //!! Check if the "New Wallboard" button is visible
  await expect(page.locator('button:has-text("New Wallboard")')).toBeVisible();
  
  //!! Check if the first mat-card is visible
  await expect(page.locator(`[data-cy="realtime-wallboards-item"]`).first()).toBeVisible();
  
  //!! Assign "Agent params Wallboard" to variable {wallboardName}
  const wallboardName = "Agent params Wallboard";
  
  //!! Enter {wallboardName} in the search field
  await page.fill('[placeholder="Type to Search"]', wallboardName);
  
  //!! Press enter to confirm search
  await page.keyboard.press("Enter");
  
  //!! Wait for 7 seconds
  await page.waitForTimeout(7000);
  
  //!! Repeat the loop to delete "Agent params Wallboard" - loop includes clicking on menu button, clicking delete option, confirming deletion and waiting 10 seconds
  while (await page.locator("text=Agent params Wallboard").count()) {
    await page.click(
      `[data-cy="realtime-wallboards-item-menu-button"]:right-of(:text('Agent params Wallboard'))`
    );
    await page.click('[data-cy="realtime-wallboards-item-delete"]');
    await page.click('[data-cy="confirmation-dialog-okay-button"]');
    await page.waitForTimeout(10000);
  }
  await cleanUpWallBoardsNotStrict(page, "Agent params Wallboard");
  
  //--------------------------------
  // Act:
  //--------------------------------
  //! Create the wallboard, configure widget, and add parameters to metric
  
  //!! Create new wallboard by clicking on "New Wallboard"
  await page.click(':text("New Wallboard")');
  
  //!! Choose "Custom" option
  await page.click(':text("Custom")');
  
  //!! Input {wallboardName} in the required input field
  await page.fill('[aria-required="true"]', wallboardName);
  
  //!! Confirm by clicking "Apply"
  await page.click(':text("Apply")');
  
  //!! Add "Agent Box" by clicking
  await page.locator(`[data-mat-icon-name="agent"]`).click();
  
  //!! Manage parameters
  await page.click('[data-mat-icon-name="more-v1"]');
  
  //!! Click "Manage Parameters"
  await page.click(':text("Manage Parameters")');
  
  //!! Click "Create New" to create a new parameter
  await page.click(':text("Create New")');
  
  //!! Fill in "test param" in the required input field for the new parameter
  await page.fill('[aria-required="true"]', "test param");
  
  //!! Click the material select element
  await page.click("mat-select");
  
  //!! Click to choose "app-category-options-translation" option
  await page.click("app-category-options-translation");
  
  //!! Choose "Replace With Contact Center Agent"
  await page.click(':text("Replace With Contact Center Agent")');
  
  //!! Save the new parameter
  await page.locator("app-category-parameter-edit-dialog :text('Save')").click();
  
  //!! Check if "test param" is visible
  await expect(page.locator("text=test param")).toBeVisible();
  
  //!! Close the current dialog
  await page.locator('[data-mat-icon-name="x"]').click();
  
  //!! Add widget by clicking on "title-value"
  await page.click("#title-value");
  
  //!! Hover over "Widget Title" 
  await page.hover(':text("Widget Title")');
  
  //!! Click on the first button in the wallboard's content
  await page.click("#wallboardContent button >> nth=1");
  
  //!! Go to data
  await page.click(':text("Go To Data")');
  
  //!! Click "Select Metric" to choose a metric
  await page.click(':text("Select Metric")');
  
  //!! Select "Inbound Call Count"
  await page.click(':text("Inbound Call Count")');
  
  //!! Click the button in the metric-list-container
  await page.click('.metric-list-container button:has-text("Done")');
  
  //!! Add agent criteria
  await page.click('[data-cy="xima-header-add-button"]');
  
  //!! Click on the search input for criteria selector
  await page.click('[data-cy="xima-criteria-selector-search-input"]');
  
  //!! Select "Agent" from the criteria options
  await page.click('[data-cy="xima-criteria-selector-option"] :text("Agent")');
  
  //!! Add parameter to metric
  await page.click('[data-cy="property-parameter-menu-button"]');
  
  //!! Hover over "Use Parameters" text
  await page.hover(':text("Use Parameters")');
  
  //!! Click "test param"
  await page.click(':text("test param")');
  
  //!! Wait for 1000 milliseconds
  await page.waitForTimeout(1000);
  
  //!! Verify visibility of "test param"
  await expect(page.locator("text=test param")).toBeVisible();
  
  //!! Click apply
  await page.click('[data-cy="metric-parameters-dialog-apply"]');
  
  //!! Wait for 3000 milliseconds
  await page.waitForTimeout(5000);
  
  //!! Get the total amount of metrics and save it as {totalAmount}
  const totalAmount = await page.innerText(
    '.widget-container-content-body:near(:text("Widget Title")) >> nth=0'
  );
  
  //!! Log the {totalAmount}
  console.log(totalAmount);
  
  //!! Click "Save and Exit"
  await page.click(':text("Save and Exit")');
  
  //! ----
  
  
  //! Share to skill group, log in as agent 501, assert agent count and log in as webRTC agent 1 to verify agent count
  
  //!! Click item-menu-button to share wallboard
  await page.click('[data-cy="realtime-wallboards-item-menu-button"]');
  
  //!! Click "Share" option
  await page.click('[data-cy="realtime-wallboards-item-share"]');
  
  //!! Select "All" to share wallboard
  await page.getByLabel("All").evaluate((node) => node.click());
  
  //!! Wait for 2000 milliseconds
  await page.waitForTimeout(2000);
  
  //!! Click Apply button to confirm selection
  await page.locator('button.apply> span:text-is(" Apply ")').click();
  
  //!! Create a new browser context, saved as {context}
  const context2 = await browser.newContext();
  
  //!! Open a new page in {context}, saved as {page2}
  const page2 = await context2.newPage();
  
  //!! Go to the baseURL
  await page2.goto(buildUrl("/"));
  
  //!! Fill in process.env.UCAGENT_1_EMAIL in consolidated login username input
  await page2.fill('[data-cy="consolidated-login-username-input"]', process.env.UC_AGENT_13_EXT_113);
  
  //!! Fill in process.env.UCAGENT_1_PASSWORD in consolidated login password input
  await page2.fill('[data-cy="consolidated-login-password-input"]', process.env.UC_AGENT_13_EXT_113_PASSWORD);
  
  //!! Perform a force click in consolidated login login button
  await page2.click('[data-cy="consolidated-login-login-button"]', {
    force: true,
  });
  
  //!! Wait for 5000 milliseconds
  await page2.waitForTimeout(5000);
  
  //!! Get the agent's widget amount and save it as {amount501}
  const amount501 = await page2.innerText("app-title-value-widget >> nth = 0");
  
  
  //!! Log {amount501}
  console.log('amount501 CONSOLE', amount501);
  
  //!! Log {totalAmount}
  console.log('totalAmount', totalAmount)
  
  //--------------------------------
  // Assert:
  //--------------------------------
  //!! Assert {amount501} not to be equal with {totalAmount}
  expect(amount501).not.toBe(totalAmount);
  
  //!! Create a new browser context, saved as {context}
  const context = await browser.newContext();
  
  //!! Open a new page in {context}, saved as {page3}
  const page3 = await context.newPage();
  
  //!! Go to the baseURL
  await page3.goto(buildUrl("/"));
  
  //!! Fill in process.env.WEBRTCAGENT_13_EMAIL in consolidated login username input
  await page3.fill(
    '[data-cy="consolidated-login-username-input"]',
    process.env.WEBRTCAGENT_13_EMAIL
  );
  
  //!! Fill in process.env.WEBRTC_PASSWORD in consolidated login password input
  await page3.fill(
    '[data-cy="consolidated-login-password-input"]',
    process.env.WEBRTC_PASSWORD
  );
  
  //!! Click the consolidated login login button
  await page3.click('[data-cy="consolidated-login-login-button"]');
  
  
  //!! Wait for 10000 milliseconds
  await page.waitForTimeout(5000);
  
  
  //!! Get the agent's widget amount and save it as {amount202}
  const amount202 = await page3.innerText("app-title-value-widget >> nth = 0");
  
  //!! Log {amount202}
  console.log('amount202', amount202)
  
  //--------------------------------
  // Assert:
  //--------------------------------
  //!! Assert {amount202} not to be equal with {totalAmount}
  expect(amount202).not.toBe(totalAmount);
  
  //! ----
  
  
  // Cleanup
  
  //! Delete wallboard and save some variables into shared context
  
  //!! Bring {page} to the front
  await page.bringToFront();
  
  //!! Click the item-menu-button with the param {wallboardName}
  await page.click(
    `[data-cy="realtime-wallboards-item-menu-button"]:right-of(:text('Agent params Wallboard'))`
  );
  
  //!! Click the delete option
  await page.click('[data-cy="realtime-wallboards-item-delete"]');
  
  //!! Click the okay button in the confirmation dialog to confirm the deletion operation
  await page.click('[data-cy="confirmation-dialog-okay-button"]');
  
  //!! Wait for 1000 milliseconds
  await page.waitForTimeout(1000);
  
  //!! Expect the {wallboardName} to not be visible
  await expect(
    page.locator('[data-cy="realtime-wallboards-item"] mat-card')
  ).not.toBeVisible();
    
 // Step 2. Add widget with incoming call metric
  //--------------------------------
  // Arrange:
  //--------------------------------
  
  
  
  //--------------------------------
  // Act:
  //--------------------------------
  
  
  
  //--------------------------------
  // Assert:
  //--------------------------------
  
  
  
 // Step 3. View Inbound Call Count on active wallboard with agent
  //--------------------------------
  // Arrange:
  //--------------------------------
  
  
  
  //--------------------------------
  // Act:
  //--------------------------------
  
  
  
  //--------------------------------
  // Assert:
  //--------------------------------
  
  
  
 // Step 4. Delete wallboard with agent param
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