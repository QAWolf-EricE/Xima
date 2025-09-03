import { assert, expect, test, getInbox, launch, dotenv, saveTrace, axios, crypto, dateFns, faker, fse, https, twilio, formatInTimeZone } from '../../qawHelpers';

test("supervisor_view_sort_by_options", async () => {
 // Step 1. Sort Realtime display by Agent name (ASC)
  //--------------------------------
  // Arrange:
  //--------------------------------
  //!! call the function logInSupervisor, destructuring the result to {page}
  const { page } = await logInSupervisor();
  
  //! ----
  
  //--------------------------------
  // Act:
  //--------------------------------
  
  //! Navigate through the side navigation bar and prepare the report preview
  
  //!! click on the sidenav-menu-REALTIME_DISPLAYS
  await page.click('[data-cy="sidenav-menu-REALTIME_DISPLAYS"]');
  
  //!! click on the text "Supervisor View"
  await page.click(':text-is("Supervisor View")');
  
  //!! click on the supervisor-view-filter-title
  await page.locator('[data-cy="supervisor-view-filter-title"]').click();
  
  //!! wait for 1000 milliseconds
  await page.waitForTimeout(1000);
  
  //!! click on the first xima-preview-input-edit-button under configure-report-preview-parameter-container
  await page
    .locator(
      '[data-cy="configure-report-preview-parameter-container"] [data-cy="xima-preview-input-edit-button"] >> nth=0',
    )
    .click();
  
  //!! wait for 1000 milliseconds
  await page.waitForTimeout(1000);
  
  //!! check if the xima-list-select-select-all checkbox is not checked, if not, click on "Select All Agents"
  if (!(await page.getByRole(`checkbox`, { name: `All` }).isChecked())) {
    // Click the "All" checkbox
    await page.getByRole(`checkbox`, { name: `All` }).click();
  }
  
  //!! wait for 2000 milliseconds
  await page.waitForTimeout(2000);
  
  //!! click on the button labeled "Apply"
  await page.locator('button.apply> span:text-is(" Apply ")').click();
  
  //!! wait for 2000 milliseconds
  await page.waitForTimeout(2000);
  
  //!! click on the supervisor-view-filter-apply-button
  await page.locator('[data-cy="supervisor-view-filter-apply-button"]').click();
  
  // See refresh dialog
  await expect(
    page.locator(`xima-dialog:has-text("Refresh Required")`),
  ).toBeVisible();
  
  // Click OK
  await page.getByRole(`button`, { name: `Ok` }).click();
  
  //! ----
  
  //! Apply and validate different sorting options
  
  //!! click on the mat-select-arrow
  await page.locator(`[panelclass="xima-ngx-select"]:has-text("Sort")`).click(); // clicks the sort dropdown
  
  //!! click on the option "Sort by agent name (ASC)"
  await page.click('[role="option"]:has-text("Sort by agent name (ASC)")');
  
  //!! click on the supervisor-view-filter-title
  await page.click('[data-cy="supervisor-view-filter-title"]');
  
  //!! wait for 5000 milliseconds
  await page.waitForTimeout(5000);
  
  //!! check if the supervisor-view-agent-offline-checkbox is checked, if not, click on it
  try {
    expect(
      await page.isChecked(
        '[data-cy="supervisor-view-agent-offline-checkbox"] [type="checkbox"]',
      ),
    ).toBeTruthy();
    await page.click(':text("Cancel")');
  } catch {
    await page.click(
      '[data-cy="supervisor-view-agent-offline-checkbox"] [type="checkbox"]',
    );
    expect(
      await page.isChecked(
        '[data-cy="supervisor-view-agent-offline-checkbox"] [type="checkbox"]',
      ),
    ).toBeTruthy();
    await page.click('[data-cy="supervisor-view-filter-apply-button"]');
  }
  
  //! ----
  
  //--------------------------------
  // Assert:
  //--------------------------------
  
  //! Validate sorting by agent name
  
  //!! get the first agent's name, save it to {agentName1}
  let agentName1 = await page.innerText(`.agent-status-fullname >> nth=0`);
  
  //!! get the second agent's name, save it to {agentName2}
  let agentName2 = await page.innerText(`.agent-status-fullname >> nth=1`);
  
  //!! create a list of agent names {listSortedByAgentNameAsc} from {agentName1} and {agentName2}
  let listSortedByAgentNameAsc = [agentName1, agentName2];
  
  //!! create a sorted copy of {listSortedByAgentNameAsc}, save it as {sortedAgentName}
  let sortedAgentName = [...listSortedByAgentNameAsc].sort();
  
  //!! assert that {listSortedByAgentNameAsc} is equal to {sortedAgentName}
  expect(listSortedByAgentNameAsc).toEqual(sortedAgentName);
  
  //! ----
  
  //--------------------------------
  // Act:
  //--------------------------------
  
  //! Apply and validate different sorting options
  
  //!! click on the mat-select-arrow
  await page.locator(`[panelclass="xima-ngx-select"]:has-text("Sort")`).click(); // clicks the sort dropdown
  
  //!! click on the option "Sort by agent name (DESC)"
  await page.click(':text("Sort by agent name (DESC)")');
  
  //!! wait for 5000 milliseconds
  await page.waitForTimeout(5000);
  
  //! ----
  
  //--------------------------------
  // Assert:
  //--------------------------------
  
  //! Validate sorting by agent name (DESC)
  
  //!! get the first agent's name, save it to {agentName1}
  agentName1 = await page.innerText(`.agent-status-fullname >> nth=0`);
  
  //!! get the second agent's name, save it to {agentName2}
  agentName2 = await page.innerText(`.agent-status-fullname >> nth=1`);
  
  //!! create a list of agent names {listSortedByAgentNameDesc} from {agentName1} and {agentName2}
  const listSortedByAgentNameDesc = [agentName1, agentName2];
  
  //!! create a sorted copy of {listSortedByAgentNameDesc}, save it as {sortedAgentName}
  sortedAgentName = [...listSortedByAgentNameDesc].sort();
  
  //!! assert that {listSortedByAgentNameDesc} is not equal to {sortedAgentName}
  expect(listSortedByAgentNameDesc).not.toEqual(sortedAgentName);
  
  //! ----
  
  //--------------------------------
  // Act:
  //--------------------------------
  
  //! Apply and validate different sorting options
  
  //!! click on the mat-select-arrow
  await page.locator(`[panelclass="xima-ngx-select"]:has-text("Sort")`).click(); // clicks the sort dropdown
  
  //!! click on the option "Sort by agent extension (ASC)"
  await page.click(':text("Sort by agent extension (ASC)")');
  
  //!! wait for 5000 milliseconds
  await page.waitForTimeout(5000);
  
  //! ----
  
  //--------------------------------
  // Assert:
  //--------------------------------
  
  //! Validate sorting by agent extension (ASC)
  
  //!! get the first agent's extension, save it to {agentExtension1}
  let agentExtension1 = (await page.innerText(`.agent-status-fullname >> nth=0`))
    .split(" ")
    .at(-1);
  
  //!! get the second agent's extension, save it to {agentExtension2}
  let agentExtension2 = (await page.innerText(`.agent-status-fullname >> nth=1`))
    .split(" ")
    .at(-1);
  
  //!! create a list of agent extensions {listSortedByExtensionAsc} from {agentExtension1} and {agentExtension2}
  let listSortedByExtensionAsc = [agentExtension1, agentExtension2];
  
  //!! create a sorted copy of {listSortedByExtensionAsc}, save it as {sortedExtensions}
  let sortedExtensions = [...listSortedByExtensionAsc].sort();
  
  //!! assert that {listSortedByExtensionAsc} is equal to {sortedExtensions}
  expect(listSortedByExtensionAsc).toEqual(sortedExtensions);
  
  //! ----
  
  //--------------------------------
  // Act:
  //--------------------------------
  
  //! Apply and validate different sorting options
  
  //!! click on the mat-select-arrow
  await page.locator(`[panelclass="xima-ngx-select"]:has-text("Sort")`).click(); // clicks the sort dropdown
  
  //!! click on the option "Sort by agent extension (DESC)"
  await page.click(':text("Sort by agent extension (DESC)")');
  
  //!! wait for 5000 milliseconds
  await page.waitForTimeout(5000);
  
  //! ----
  
  //--------------------------------
  // Assert:
  //--------------------------------
  
  //! Validate sorting by agent extension (DESC)
  
  //!! get the first agent's extension, save it to {agentExtension1}
  agentExtension1 = (await page.innerText(`.agent-status-fullname >> nth=0`))
    .split(" ")
    .at(-1);
  
  //!! get the second agent's extension, save it to {agentExtension2}
  agentExtension2 = (await page.innerText(`.agent-status-fullname >> nth=1`))
    .split(" ")
    .at(-1);
  
  //!! create a list of agent extensions {listSortedByExtensionDesc} from {agentExtension1} and {agentExtension2}
  const listSortedByExtensionDesc = [agentExtension1, agentExtension2];
  
  //!! create a sorted copy of {listSortedByExtensionDesc}, save it as {sortedExtensions}
  sortedExtensions = [...listSortedByExtensionDesc].sort();
  
  //!! assert that {listSortedByExtensionDesc} is not equal to {sortedExtensions}
  expect(listSortedByExtensionDesc).not.toEqual(sortedExtensions);
  
  //! ----
  
  //--------------------------------
  // Act:
  //--------------------------------
  
  //! Reset and apply default settings
  
  //!! click on the supervisor-view-filter-title
  await page.locator('[data-cy="supervisor-view-filter-title"]').click();
  
  //!! click on the first xima-preview-input-edit-button under configure-report-preview-parameter-container
  await page
    .locator(
      '[data-cy="configure-report-preview-parameter-container"] [data-cy="xima-preview-input-edit-button"] >> nth=0',
    )
    .click();
  
  //!! if the xima-list-select-select-all checkbox is checked, uncheck it
  if (await page.getByRole(`checkbox`, { name: `All` }).isChecked()) {
    // Click the "All" checkbox
    await page.getByRole(`checkbox`, { name: `All` }).click();
  }
  
  //!! wait for 2000 milliseconds
  await page.waitForTimeout(2000);
  
  //!! click on the button labeled "Apply"
  await page.locator('button.apply> span:text-is(" Apply ")').click();
  
  //!! wait for 2000 milliseconds
  await page.waitForTimeout(2000);
  
  //!! click on the supervisor-view-filter-apply-button
  await page.locator('[data-cy="supervisor-view-filter-apply-button"]').click();
  
 // Step 2. Sort Realtime display by Agent name (DESC)
  // Description:
 // Step 3. Sort Realtime display by Agent extension (ASC)
  // Description:
 // Step 4. Sort Realtime display by Agent extension (DESC)
  // Description:
});