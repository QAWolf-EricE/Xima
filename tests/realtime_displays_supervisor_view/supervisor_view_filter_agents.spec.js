import { logInSupervisor } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("supervisor_view_filter_agents", async () => {
 // Step 1. Filter agents on Realtime display
  //--------------------------------
  // Arrange:
  //--------------------------------
  // Login as Supervisor
  const { page } = await logInSupervisor();
  await expect(page.locator('[translationset="HOME_TITLE"]')).toHaveText(
    "Reports",
  );
  
  // Navigate to Supervisor View
  await page.locator(`[data-cy="sidenav-menu-REALTIME_DISPLAYS"]`).click();
  await page.getByRole(`tab`, { name: `Supervisor View` }).click();
  
  // Verify we're in supervisor view
  await expect(page).toHaveURL(/realtime-status/);
  await expect(page.locator(':text("Supervisor View")')).toBeEnabled();
  
  // Revert to skill view if needed
  try {
    await expect(
      page.locator("app-realtime-status-summary-item").first(),
    ).toBeVisible({ timeout: 5000 });
  } catch {
    // Revert view to skill view
    await page.locator('[data-cy="supervisor-view-filter-title"]').click();
    await page.locator(`.realtime-status-sidenav-content-group-select`).click();
    await page.locator(`[role="option"]:has-text("Skill")`).click();
    await page.waitForTimeout(1000);
    await page.locator('button:has-text(" Apply ")').click();
  
    // See refresh dialog
    await expect(
      page.locator(`xima-dialog:has-text("Refresh Required")`),
    ).toBeVisible();
  
    // Click OK
    await page.getByRole(`button`, { name: `Ok` }).click();
  }
  
  // Wait for results to load
  await expect(page.locator(`app-filter-agent`)).not.toBeVisible();
  await expect(
    page.getByRole(`paragraph`).filter({ hasText: `Calls in Queue` }),
  ).toBeVisible();
  
  // Verify we're in skill view
  const skills = await page.locator("app-realtime-status-summary-item").count();
  const agents = await page.locator("app-agent-status").count();
  expect(skills).toBeGreaterThan(0);
  
  //--------------------------------
  // Act:
  //--------------------------------
  // Filter agents on supervisor view
  await page.locator('[data-cy="supervisor-view-filter-title"]').click();
  await page.locator(`.realtime-status-sidenav-content-group-select`).click();
  await page.locator(`[role="option"]:has-text("Agent")`).click();
  
  // Click the pencil edit icon next to Agents
  await page
    .locator(
      `app-configure-report-preview-parameter:has(mat-label:has-text("Agents")) button`,
    )
    .click();
  
  // Uncheck all the Agents in the modal
  await page.locator(`[data-cy="xima-list-select-select-all"] input`).check();
  await page.locator(`[data-cy="xima-list-select-select-all"] input`).uncheck();
  
  // Select the first 2
  await page.locator(`mat-list-option >> nth=0`).click();
  await page.locator(`mat-list-option >> nth=1`).click();
  
  // Apply changes in modal
  await page.locator('cdk-dialog-container button:has-text(" Apply ")').click();
  
  // Apply changes in Filter Agents sidebar
  await page.locator('app-filter-agent button:has-text(" Apply ")').click();
  
  // Wait for results to load
  await expect(page.locator(`app-filter-agent`)).not.toBeVisible();
  await expect(
    page.getByRole(`paragraph`).filter({ hasText: `Calls in Queue` }),
  ).not.toBeVisible();
  
  // Click the filters button
  await page.locator('[data-cy="supervisor-view-filter-title"]').click();
  //--------------------------------
  // Assert:
  //--------------------------------
  // Assert Selection was updated to Agent
  await expect(
    page.locator(
      `span:text("Selection Mode") ~ mat-form-field:has(span:text("Agent"))`,
    ),
  ).toBeVisible();
  await expect(page.locator(`mat-label:has-text("Agents")`)).toBeVisible();
  
  // Verify view was changed and only agents display
  const newSkills = page.locator("app-realtime-status-summary-item");
  await expect(newSkills).toHaveCount(0);
  
  // Assert count of agents
  const newAgents = await page.locator("app-agent-status").count();
  const expectedCount = (
    await page
      .locator(
        `mat-label:has-text("Agents") ~ div app-criteria-parameter-preview`,
      )
      .innerText()
  ).split(" Selected")[0];
  expect(newAgents).toBeGreaterThanOrEqual(Number(expectedCount));
  
});