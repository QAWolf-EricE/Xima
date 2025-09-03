import { logInSupervisor } from '../../lib/node_20_helpers';
import { assert, axios, crypto, dateFns, dotenv, expect, faker, formatInTimeZone, fse, getInbox, https, launch, saveTrace, test, twilio } from '../../qawHelpers';


test("create_new_wallboard_custom_1_7_widgets", async () => {
 // Step 1. Add widget: Active calls
  //--------------------------------
  // Arrange:
  //--------------------------------
  const wallboardPrefix = `QA Wallboard 1-7`;
  const wallboardName = `${wallboardPrefix} ` + Date.now().toString().slice(-4);
  
  const activeCallTitle = `Testing Active Calls`;
  const chartTitle = `Testing Chart Title`;
  const gaugeTitle = `Gauge Testing Title`;
  const imageTitle = `Image Testing Title`
  const leaderboardTitle = `Leaderboard Title Testing`
  
  // Login as Supervisor
  const { page } = await logInSupervisor();
  await expect(page.locator('[translationset="HOME_TITLE"]')).toHaveText(
    "Reports",
  );
  
  // Navigate to realtime wallboards
  await page.locator('[data-cy="sidenav-menu-REALTIME_DISPLAYS"]').hover();
  await page.locator(':text("Realtime Wallboards")').click();
  
  // Ensure page loads
  await expect(page.locator(`button:has-text("New Wallboard")`)).toBeVisible({
    timeout: 60000,
  });
  await expect(
    page.locator('[data-cy="realtime-wallboards-item"]').first(),
  ).toBeVisible();
  
  // Clean test if needed
  await page.locator('[placeholder="Type to Search"]').fill(wallboardPrefix);
  await page.keyboard.press("Enter");
  
  // Wait for search results to load
  await page.waitForTimeout(5000);
  
  // Cleanup existing wallboards
  while (await page.locator(`:text("${wallboardPrefix}")`).count()) {
    await page
      .locator(
        `[data-cy="realtime-wallboards-item-menu-button"]:right-of(:text("${wallboardPrefix}")) >> nth=0`,
      )
      .click();
    await page.locator('[data-cy="realtime-wallboards-item-delete"]').click();
    await page.locator('[data-cy="confirmation-dialog-okay-button"]').click();
    await page.waitForTimeout(5000);
  }
  
  // Create Custom Real wallboard
  await page.locator(`button:has-text("New Wallboard")`).click();
  await expect(
    page.getByRole(`heading`, { name: `Select a template` }),
  ).toBeVisible();
  
  // Click Custom Wallboard option
  await page.locator(`.card:has(p:text-is("Custom"))`).click();
  await expect(
    page.locator(`xima-dialog:has-text("Edit Wallboard")`),
  ).toBeVisible();
  
  // Fill in 'Edit Wallboard' modal information
  await page.locator(`mat-label:text("Title") ~ mat-form-field`).click();
  await page
    .locator(`mat-label:text("Title") ~ mat-form-field input`)
    .fill(wallboardName);
  await page.keyboard.press("Enter");
  
  // Click the Apply button in the modal
  await page.locator(`xima-dialog button:has-text("Apply")`).click();
  await expect(
    page.locator(`xima-dialog:has-text("Edit Wallboard")`),
  ).not.toBeVisible();
  await expect(page.getByRole(`button`, { name: `Save and Exit` })).toBeVisible();
  //--------------------------------
  // Act:
  //--------------------------------
  // Click the Active Calls on the side panel
  await page
    .locator(`app-wallboard-widget-toolbar-item:has-text("Active Calls")`)
    .scrollIntoViewIfNeeded();
  await page.waitForTimeout(1000);
  await page
    .locator(`app-wallboard-widget-toolbar-item:has-text("Active Calls")`)
    .click();
  
  // Verify Active Calls is added
  await expect(
    page.locator(`app-widget-container:has-text("Widget Title")`),
  ).toBeVisible();
  await page.locator(`app-widget-container span:text("Widget Title")`).click();
  
  // Fill in Title field
  await page
    .locator(`[data-cy="widget-header-data-settings-title"]`)
    .fill(activeCallTitle);
  
  // Open the Agent addition dialog
  await page.locator(
    'app-configure-report-preview-parameter:has-text("Agent") app-preview-input button'
  ).click();
  
  // Select all agents for the widget
  await page.locator('[data-cy="xima-list-select-select-all"]').click();
  
  // Apply the agent selection
  await page.locator(`[data-cy="agents-roles-dialog-apply-button"]`).click();
  
  // Open the Skills addition dialog
  await page.locator(
    'app-configure-report-preview-parameter:has-text("Skill") app-preview-input button'
  ).click();
  
  // Select "Skill 5" for the widget
  await page.getByRole('option', { name: 'Skill 5', exact: true }).click();
  
  // Apply the skill selection
  await page.getByRole(`button`, { name: `Apply` }).click();
  
  // Wait for 1 second
  await page.waitForTimeout(1000);
  
  // Click Apply button
  await expect(page.locator(`button:has-text("Apply")`)).toBeEnabled();
  await page.locator(`button:has-text("Apply")`).click();
  
  //--------------------------------
  // Assert:
  //--------------------------------
  // Assert "Active Calls" widget is added
  await expect(
    page.locator(`app-widget-container:has(app-active-calls-widget):has-text("${activeCallTitle}")`),
  ).toBeVisible();
  await expect(
    page.locator(`app-widget-container:has-text("Widget Title")`),
  ).not.toBeVisible();
  await expect(
    page.locator(`[data-cy="widget-header-data-settings-title"]`),
  ).not.toBeVisible();
  
 // Step 2. Add widget: Agent box
  //--------------------------------
  // Arrange:
  //--------------------------------
  //--------------------------------
  // Act:
  //--------------------------------
  // Click the Agent Box on the side panel
  await page
    .locator(`app-wallboard-widget-toolbar-item:has-text("Agent Box")`)
    .scrollIntoViewIfNeeded();
  await page.waitForTimeout(1000);
  await page
    .locator(`app-wallboard-widget-toolbar-item:has-text("Agent Box")`)
    .click();
  
  // Verify Agent Box is added
  await expect(page.locator(`app-agent-box-widget-container`)).toBeVisible();
  
  // Click on Agent box
  await page.locator(`app-agent-box-widget-container`).click();
  
  // Verify Side panel edit appears
  await expect(page.locator(`app-agent-dropdown-select`)).toBeVisible();
  
  // Select an agent
  await page.locator(`app-agent-dropdown-select`).click();
  await page.getByRole(`option`, { name: `WebRTC Agent 12` }).click();
  
  // Click Apply button
  await expect(page.locator(`button:has-text("Apply")`)).toBeEnabled();
  await page.locator(`button:has-text("Apply")`).click();
  //--------------------------------
  // Assert:
  //--------------------------------
  // Assert Agent box appears
  await expect(
    page.locator(`app-agent-box-widget-container:has-text("WebRTC Agent 12")`),
  ).toBeVisible({ timeout: 2 * 60 * 1000 });
  
 // Step 3. Add widget: Chart
  //--------------------------------
  // Arrange:
  //--------------------------------
  
  //--------------------------------
  // Act:
  //--------------------------------
  // Click the Chart on the side panel
  await page
    .locator(`app-widget-name-translation:text-is("Chart")`)
    .scrollIntoViewIfNeeded();
  await page.waitForTimeout(1000);
  await page.locator(`app-widget-name-translation:text-is("Chart")`).click();
  
  // Verify Chart is added
  await expect(
    page.locator(`app-widget-container:has-text("Widget Title")`),
  ).toBeVisible();
  await page.locator(`app-widget-container span:text("Widget Title")`).click();
  
  // Verify Side panel edit appears
  await expect(
    page.locator(`mat-label:text("Title") ~ mat-form-field`),
  ).toBeVisible();
  await expect(page.locator(`[placeholder="Select a Category"]`)).toBeVisible();
  
  // Fill in Title field
  await page
    .locator(`[data-cy="widget-header-data-settings-title"]`)
    .fill(chartTitle);
  
  // Click Category dropdown
  await page.locator(`[placeholder="Select a Category"]`).click();
  
  // Select a Category
  await expect(
    page.getByRole(`option`, { name: `Call Direction` }),
  ).toBeVisible();
  await page.getByRole(`option`, { name: `Call Direction` }).click();
  
  // Click the Pencil edit icon
  await page.getByRole(`region`, { name: `Values` }).getByRole(`button`).click();
  
  // Select All in the Call Directions modal
  await expect(
    page.locator(`app-configure-report-parameter:has-text("Call Directions")`),
  ).toBeVisible();
  await page
    .locator(`[type="checkbox"]:left-of(:text("All")) >> nth=0`)
    .evaluate((node) => node.click());
  
  // Apply changes
  await page
    .locator(
      `app-configure-report-parameter:has-text("Call Directions") button:has-text("Apply")`,
    )
    .click();
  
  // Select Metric
  await expect(page.locator(`[placeholder="Select Metric"]`)).toBeVisible();
  await page.locator(`[placeholder="Select Metric"]`).click();
  await expect(
    page.locator(`xima-dialog:has-text("Metric Selector")`),
  ).toBeVisible();
  
  // Select option from the Metrics modal
  await page.getByRole(`list`).getByText(`Abandoned Call Count`).click();
  await page.locator(`xima-dialog button:has-text("Done")`).click();
  
  // Apply changes in the Abandoned Call Count modal
  await expect(
    page.locator(`xima-dialog:has-text("Abandoned Call Count")`),
  ).toBeVisible();
  await page
    .locator(
      `xima-dialog:has-text("Abandoned Call Count") button:has-text("Apply")`,
    )
    .click();
  
  // Click Apply button on side panel
  await expect(page.locator(`button:has-text("Apply")`)).toBeEnabled();
  await page.locator(`button:has-text("Apply")`).click();
  
  //--------------------------------
  // Assert:
  //--------------------------------
  // Assert the widget with the title "Testing Chart Title" is present
  await expect(
    page.locator(
      `app-widget-container:has-text("${chartTitle}"):has(app-chart-widget):has-text("Abandoned Call Count")`,
    ),
  ).toBeVisible();
  
  
 // Step 4. Add widget: Gauge
  //--------------------------------
  // Arrange:
  //--------------------------------
  
  //--------------------------------
  // Act:
  //--------------------------------
  // Click the Gauge on the side panel
  await page
    .locator(`app-widget-name-translation:text-is("Gauge")`)
    .scrollIntoViewIfNeeded();
  await page.waitForTimeout(1000);
  await page.locator(`app-widget-name-translation:text-is("Gauge")`).click();
  
  // Verify Gauge is added
  await expect(
    page.locator(`app-widget-container:has-text("Widget Title")`),
  ).toBeVisible();
  await page.locator(`app-widget-container span:text("Widget Title")`).click();
  
  // Verify Side panel edit appears
  await expect(
    page.locator(`mat-label:text("Title") ~ mat-form-field`),
  ).toBeVisible();
  await expect(page.locator(`[placeholder="Select Metric"]`)).toBeVisible();
  await expect(
    page.locator(`mat-label:text("Min. Value") ~ mat-form-field`),
  ).toBeVisible();
  await expect(
    page.locator(`mat-label:text("Max. Value") ~ mat-form-field`),
  ).toBeVisible();
  
  // Fill in Title field
  await page
    .locator(`[data-cy="widget-header-data-settings-title"]`)
    .fill(gaugeTitle);
  
  // Select Metric
  await page.locator(`[placeholder="Select Metric"]`).click();
  await expect(
    page.locator(`xima-dialog:has-text("Metric Selector")`),
  ).toBeVisible();
  
  // Select option from the Metrics modal
  await page.getByRole(`list`).getByText(`ACW Count`).click();
  await page.locator(`xima-dialog button:has-text("Done")`).click();
  
  // Apply changes in the ACW Count modal
  await expect(
    page.locator(`xima-dialog:has-text("ACW Count")`),
  ).toBeVisible();
  await page
    .locator(
      `xima-dialog:has-text("ACW Count") button:has-text("Apply")`,
    )
    .click();
  
  // Set Min Value to 100
  await page.locator(`mat-label:text("Min. Value") ~ mat-form-field input`).fill(`100`)
  
  // Click Apply button on side panel
  await expect(page.locator(`button:has-text("Apply")`)).toBeEnabled();
  await page.locator(`button:has-text("Apply")`).click();
  //--------------------------------
  // Assert:
  //--------------------------------
  // Assert the widget with the title "Gauge Testing title" is present
  await expect(
    page.locator(
      `app-widget-container:has-text("${gaugeTitle}"):has(app-gauge-widget)`,
    ),
  ).toBeVisible();
  
  
 // Step 5. Add widget: Group box
  //--------------------------------
  // Arrange:
  //--------------------------------
  
  //--------------------------------
  // Act:
  //--------------------------------
  // Click the Group Box on the side panel
  await page
    .locator(`app-widget-name-translation:text-is("Group Box")`)
    .scrollIntoViewIfNeeded();
  await page.waitForTimeout(1000);
  await page.locator(`app-widget-name-translation:text-is("Group Box")`).click();
  
  // Click the right arrow
  await page
    .getByRole(`button`)
    .filter({ hasText: `keyboard_arrow_right` })
    .click();
  
  // Verify Group Box is added
  await expect(
    page.locator(`app-widget-container:has-text("Group Box")`),
  ).toBeVisible();
  await page.locator(`app-widget-container span:text("Group Box")`).click();
  
  // Verify Side panel edit appears
  await expect(page.locator(`app-group-dropdown-select`)).toBeVisible();
  
  // Click the Group dropdown
  await page.locator(`[placeholder="Groups"]`).click();
  
  // Select Skill 3
  await page.getByRole(`option`, { name: `Skill 3`, exact: true }).click();
  
  // Click Apply button on side panel
  await expect(page.locator(`button:has-text("Apply")`)).toBeEnabled();
  await page.locator(`button:has-text("Apply")`).click();
  
  // Click the right arrow
  await page
    .getByRole(`button`)
    .filter({ hasText: `keyboard_arrow_right` })
    .click();
  //--------------------------------
  // Assert:
  //--------------------------------
  // Assert Skill 3 is visible in the group box widget
  await expect(
    page.locator(
      `app-group-box-widget-container:has-text("Skill 3")`,
    ),
  ).toBeVisible();
  await expect(
    page.locator(
      `app-group-box-widget-container:has-text("Calls in Queue")`,
    ),
  ).toBeVisible();
  await expect(
    page.locator(
      `app-group-box-widget-container:has-text("Max")`,
    ),
  ).toBeVisible();
  await expect(
    page.locator(
      `app-group-box-widget-container:has-text("Average")`,
    ),
  ).toBeVisible();
  
 // Step 6. Add widget: Image
  //--------------------------------
  // Arrange:
  //--------------------------------
  // Click the left arrow to expand panel
  await page.getByRole(`button`).filter({ hasText: `keyboard_arrow_left` }).click();
  
  //--------------------------------
  // Act:
  //--------------------------------
  // Click the Image on the side panel
  await page
    .locator(`app-widget-name-translation:text-is("Image")`)
    .scrollIntoViewIfNeeded();
  await page.waitForTimeout(1000);
  await page.locator(`app-widget-name-translation:text-is("Image")`).click();
  
  // Click the right arrow
  await page
    .getByRole(`button`)
    .filter({ hasText: `keyboard_arrow_right` })
    .click();
  
  // Verify Image is added
  await expect(
    page.locator(`app-widget-container:has-text("Widget Title"):has([src=""])`),
  ).toBeVisible();
  await page.locator(`app-widget-container span:text("Widget Title")`).click();
  
  // Verify Side panel edit appears
  await expect(
    page.locator(`mat-label:text("Title") ~ mat-form-field`),
  ).toBeVisible();
  
  // Fill in Title field
  await page
    .locator(`[data-cy="widget-header-data-settings-title"]`)
    .fill(imageTitle);
  
  // Prepare file path for the image to be added
  page.once("filechooser", (chooser) => {
    chooser.setFiles("/home/wolf/files/avatar.png").catch(console.error)
  })
  
  // Click Browse Files
  await page.getByText(`Browse Files`).click();
  
  // Click Apply button on side panel
  await expect(page.locator(`button:has-text("Apply")`)).toBeEnabled();
  await page.locator(`button:has-text("Apply")`).click();
  
  // Click the right arrow
  await page
    .getByRole(`button`)
    .filter({ hasText: `keyboard_arrow_right` })
    .click();
  //--------------------------------
  // Assert:
  //--------------------------------
  // Assert Image is visible in the Image widget
  await expect(
    page.locator(
      `app-widget-container:has-text("${imageTitle}"):has(app-image-widget-container:has(img[src*="png"]))`,
    ),
  ).toBeVisible();
 // Step 7. Add widget: Leaderboard
  //--------------------------------
  // Arrange:
  //--------------------------------
  // Click the left arrow to expand panel
  await page.getByRole(`button`).filter({ hasText: `keyboard_arrow_left` }).click();
  
  //--------------------------------
  // Act:
  //--------------------------------
  // Click the Leaderboard on the side panel
  await page
    .locator(`app-widget-name-translation:text-is("Leaderboard")`)
    .scrollIntoViewIfNeeded();
  await page.waitForTimeout(1000);
  await page.locator(`app-widget-name-translation:text-is("Leaderboard")`).click();
  
  // Click the right arrow
  await page
    .getByRole(`button`)
    .filter({ hasText: `keyboard_arrow_right` })
    .click();
  
  // Verify Leaderboard is added
  await expect(
    page.locator(`app-widget-container:has-text("Widget Title")`),
  ).toBeVisible();
  await page.locator(`app-widget-container span:text("Widget Title")`).click();
  
  // Verify Side panel edit appears
  await expect(
    page.locator(`mat-label:text("Title") ~ mat-form-field`),
  ).toBeVisible();
  await expect(page.locator(`[placeholder="Select a Category"]`)).toBeVisible();
  
  // Fill in Title field
  await page
    .locator(`[data-cy="widget-header-data-settings-title"]`)
    .fill(leaderboardTitle);
  
  // Click Category dropdown
  await page.locator(`[placeholder="Select a Category"]`).click();
  await page.waitForTimeout(1000);
  
  // Select a Category
  await expect(page.getByRole(`option`, { name: `Agent` })).toBeVisible();
  await page.getByRole(`option`, { name: `Agent` }).click();
  await page.waitForTimeout(1000);
  
  // Click the Pencil edit icon
  await page.getByRole(`region`, { name: `Values` }).getByRole(`button`).click();
  await page.waitForTimeout(1000);
  
  // Select All in the Agents modal
  await expect(
    page.locator(`app-configure-report-parameter:has-text("Agents")`),
  ).toBeVisible();
  await page
    .locator(`[type="checkbox"]:left-of(:text("All")) >> nth=0`)
    .evaluate((node) => node.click());
  await page.waitForTimeout(1000);
  
  // Apply changes
  await page
    .locator(
      `app-configure-report-parameter:has-text("Agent") button:has-text("Apply")`,
    )
    .click();
  await page.waitForTimeout(1000);
  
  // Select Metric
  await page.locator(`[placeholder="Select Metric"]`).click();
  await expect(
    page.locator(`xima-dialog:has-text("Metric Selector")`),
  ).toBeVisible();
  
  // Select option from the Metrics modal
  await page.getByRole(`list`).getByText(`Agent State`).click();
  await page.waitForTimeout(1000);
  await page.locator(`xima-dialog button:has-text("Done")`).click();
  
  // Apply changes in the Agent State modal
  await page.waitForTimeout(1000);
  await expect(
    page.locator(`xima-dialog:has-text("Agent State")`),
  ).toBeVisible();
  await page
    .locator(
      `xima-dialog:has-text("Agent State") button:has-text("Apply")`,
    )
    .click();
  
  // Click Apply button on side panel
  await expect(page.locator(`button:has-text("Apply")`)).toBeEnabled();
  await page.locator(`button:has-text("Apply")`).click();
  
  // Click the right arrow
  await page
    .getByRole(`button`)
    .filter({ hasText: `keyboard_arrow_right` })
    .click();
  
  //--------------------------------
  // Assert:
  //--------------------------------
  // Assert the widget with the title "Leaderboard Title Testing" is present
  await expect(
    page.locator(
      `app-widget-container:has-text("${leaderboardTitle}"):has(app-leaderboard-widget):has-text("Name"):has-text("Agent State")`,
    ),
  ).toBeVisible();
  
  // Assert other widgets are visible
  await expect(
    page.locator(`app-widget-container:has(app-active-calls-widget):has-text("${activeCallTitle}")`),
  ).toBeVisible();
  await expect(
    page.locator(`app-agent-box-widget-container:has-text("WebRTC Agent 12")`),
  ).toBeVisible();
  await expect(
    page.locator(
      `app-widget-container:has-text("${chartTitle}"):has(app-chart-widget):has-text("Abandoned Call Count")`,
    ),
  ).toBeVisible();
  await expect(
    page.locator(
      `app-widget-container:has-text("${gaugeTitle}"):has(app-gauge-widget)`,
    ),
  ).toBeVisible();
  await expect(
    page.locator(
      `app-group-box-widget-container:has-text("Skill 3")`,
    ),
  ).toBeVisible();
  await expect(
    page.locator(
      `app-group-box-widget-container:has-text("Calls in Queue")`,
    ),
  ).toBeVisible();
  await expect(
    page.locator(
      `app-group-box-widget-container:has-text("Max")`,
    ),
  ).toBeVisible();
  await expect(
    page.locator(
      `app-group-box-widget-container:has-text("Average")`,
    ),
  ).toBeVisible();
  await expect(
    page.locator(
      `app-widget-container:has-text("${imageTitle}"):has(app-image-widget-container:has(img[src*="png"]))`,
    ),
  ).toBeVisible();
  
  // Assert there are 7 widgets
  await expect(page.locator(`app-widget-container`)).toHaveCount(7)
  
  // Click the kebab button next to the Save and Exit button
  await page.locator('button:has-text("Save and Exit") ~ button').click();
  
  // Click go to Preview
  await page.getByRole(`menuitem`, { name: `Go to Preview` }).click();
  await expect(page.locator(`button:has-text("Full Screen")`)).toBeVisible();
  await page.waitForTimeout(2000);
  
  // Assert all widgets are visible
  await expect(
    page.locator(
      `app-widget-container:has-text("${leaderboardTitle}"):has(app-leaderboard-widget):has-text("Name"):has-text("Agent State")`,
    ),
  ).toBeVisible();
  await expect(
    page.locator(`app-widget-container:has(app-active-calls-widget):has-text("${activeCallTitle}")`),
  ).toBeVisible();
  await expect(
    page.locator(`app-agent-box-widget-container:has-text("WebRTC Agent 12")`),
  ).toBeVisible();
  await expect(
    page.locator(
      `app-widget-container:has-text("${chartTitle}"):has(app-chart-widget):has-text("Abandoned Call Count")`,
    ),
  ).toBeVisible();
  await expect(
    page.locator(
      `app-widget-container:has-text("${gaugeTitle}"):has(app-gauge-widget)`,
    ),
  ).toBeVisible();
  await expect(
    page.locator(
      `app-group-box-widget-container:has-text("Skill 3")`,
    ),
  ).toBeVisible();
  await expect(
    page.locator(
      `app-group-box-widget-container:has-text("Calls in Queue")`,
    ),
  ).toBeVisible();
  await expect(
    page.locator(
      `app-group-box-widget-container:has-text("Max")`,
    ),
  ).toBeVisible();
  await expect(
    page.locator(
      `app-group-box-widget-container:has-text("Average")`,
    ),
  ).toBeVisible();
  await expect(
    page.locator(
      `app-widget-container:has-text("${imageTitle}"):has(app-image-widget-container:has(img[src*="png"]))`,
    ),
  ).toBeVisible();
  await expect(page.locator(`app-widget-container`)).toHaveCount(7)
  //----------------------
  // Cleanup:
  //----------------------
  // Click the kebab button next to the Full Screen button
  await page.locator("app-fullscreen-btn ~ button").click();
  
  await page.locator('button:has-text("Edit Wallboard")').click();
  await expect(page.locator('button:has-text("Save and Exit")')).toBeVisible();
  await page.locator('button:has-text("Save and Exit")').click();
  
  // Wait for page to load
  await expect(page.locator('button:has-text("New Wallboard")')).toBeVisible({
    timeout: 60000,
  });
  
  // Delete wallboard
  await expect(
    page.locator(
      `[data-cy="realtime-wallboards-item"]:has([data-cy="realtime-wallboards-item-title"]:text("${wallboardName}"))`,
    ),
  ).toBeVisible();
  
  // Click the kebab menu
  await page
    .locator(
      `[data-cy="realtime-wallboards-item"]:has([data-cy="realtime-wallboards-item-title"]:text("${wallboardName}")) button`,
    )
    .click();
  
  // Click the Delete option
  await page.getByRole(`menuitem`, { name: `Delete` }).click();
  
  // Click Confirm in the delete modal
  await page.locator('[data-cy="confirmation-dialog-okay-button"]').click();
  
  // Verify Wallboard card disappears
  await expect(
    page.locator(
      `[data-cy="realtime-wallboards-item"]:has([data-cy="realtime-wallboards-item-title"]:text("${wallboardName}"))`,
    ),
  ).not.toBeVisible();
  
});