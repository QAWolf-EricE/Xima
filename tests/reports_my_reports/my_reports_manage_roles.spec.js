import { logInSupervisor } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("my_reports_manage_roles", async () => {
 // Step 1. My Reports: Manage Roles
  //--------------------------------
  // Arrange:
  //--------------------------------
  
  //!! Call {logInSupervisor} and get {page}
  const { page } = await logInSupervisor();
  
  //!! Expect the title to be "Reports"
  await expect(page.locator('[translationset="HOME_TITLE"]')).toHaveText(
    "Reports"
  );
  
  //!! Click the more options button
  await page.click('[data-cy="manage-menu-open-button"]');
  
  //!! Click the manage roles option
  await page.click('[data-cy="manage-menu-manage-roles"]');
  
  //!! Expect the manage roles modal to be visible
  await expect(page.locator("app-manage-roles")).toBeVisible({ timeout: 60000 });
  
  //! ----
  
  //! Clean previous test roles
  
  //!! Remove any existing roles named "QA Role"
  while (await page.locator("text=QA Role").count()) {
    await page.click(`[data-mat-icon-name="delete"]:right-of(:text('QA Role'))`);
    await page.waitForTimeout(500);
  }
  
  //! ----
  
  //--------------------------------
  // Act:
  //--------------------------------
  
  //! Create a new role and assign it to all agents
  
  //!! Create a unique role name, {newRole}
  const newRole = "QA Role " + Date.now().toString().slice(-4);
  
  //!! Fill in the "New Role" input with {newRole}
  await page.fill('[placeholder="New Role"]', newRole);
  
  //!! Click "Add Role"
  try {
    await page.locator(`.enter-new-role-icon`).click({ timeout: 3000 });
  } catch {
    await page.locator(`:text("Add Role")`).click();
  }
  
  //!! Assert that the newly created role is visible in the roles list
  await expect(page.locator(`text=${newRole}`)).toBeVisible({ timeout: 60000 });
  
  //!! Hover over the new role text
  await page.hover(`:text("${newRole}")`);
  
  //!! Click the edit icon next to the new role
  await page.click(`[data-mat-icon-name="edit"]:right-of(:text('${newRole}'))`);
  
  //!! Wait for 10 seconds
  await page.waitForTimeout(10000);
  
  //!! Click the "Select All Agents" option
  await page.click(':text("Select All Agents")');
  
  // grab number of agents
  const totalAgents = await page.innerText(`.data-source-agent-length >> nth=0`);
  
  //!! Close the edit role modal
  await page.click(':text("close")');
  
  //!! Open the more options button again
  await page.click('[data-cy="manage-menu-open-button"]');
  
  //!! Click the manage roles option again
  await page.click('[data-cy="manage-menu-manage-roles"]');
  
  //! ----
  
  //--------------------------------
  // Assert:
  //--------------------------------
  
  //! Check the role was edited correctly
  let text = ''
  //!! Extract the fourth item's text in the roles item list and store that in variable {text}
  try {
  await expect(page.locator(`mat-list-item:has-text("${newRole}")`)).toBeVisible({timeout:3000});
  text = await page.innerText(`mat-list-item:has-text("${newRole}")`);
  } catch {
  text = await page.innerText(`.role-item:has-text("${newRole}")`);
  }
  
  //!! Split the {text} and store the resulting array in variable {numOfAgents}
  const numOfAgents = text.split("\n")[1].split(" ")[0];
  
  //!! Log the second element of the {numOfAgents} array
  console.log("TEXT: ", text.split("\n")[1].split(" ")[0]);
  
  //!! Assert that the text showing the number of agents is visible
  await expect(page.locator(`text=${numOfAgents[1]} Agents`).first()).toBeVisible(
    { timeout: 60000 }
  ); // selected all agents
  
  try {
  await expect(
    page.locator(
      `mat-list-item:has-text("${newRole}"):has-text("${totalAgents} Agents")`
    )
  ).toBeVisible({timeout:3000});
  } catch {
  await expect(
    page.locator(
      `.role-item:has-text("${newRole}"):has-text("${totalAgents} Agents")`
    )
  ).toBeVisible();
  }
  
  //! ----
  
  //--------------------------------
  // Act:
  //--------------------------------
  
  //! Delete the created role
  
  //!! Hover over the new role text
  await page.hover(`:text("${newRole}")`);
  
  //!! Click the delete icon next to the new role
  await page.click(`[data-mat-icon-name="delete"]:right-of(:text('${newRole}'))`);
  
  //! ----
  
  //--------------------------------
  // Assert:
  //--------------------------------
  
  //! Ensure the role is deleted
  
  //!! Assert that the new role is hidden
  await expect(page.locator(`text=${newRole}`)).toBeHidden({ timeout: 60000 });
 // Step 2. Add Role
  //--------------------------------
  // Arrange:
  //--------------------------------
  
  
  
  //--------------------------------
  // Act:
  //--------------------------------
  
  
  
  //--------------------------------
  // Assert:
  //--------------------------------
  
  
  
 // Step 3. Add all agents to a role
  //--------------------------------
  // Arrange:
  //--------------------------------
  
  
  
  //--------------------------------
  // Act:
  //--------------------------------
  
  
  
  //--------------------------------
  // Assert:
  //--------------------------------
  
  
  
 // Step 4. Delete Role
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