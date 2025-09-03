import { assert, expect, test, getInbox, launch, dotenv, saveTrace, axios, crypto, dateFns, faker, fse, https, twilio, formatInTimeZone } from '../qawHelpers';

// Imports
const dns = await import("node:dns/promises");

// logs UC agent into the Webphone
export async function logUCAgentIntoUCWebphone(
  browserOrContext,
  agentWebphoneUsername,
  options = {},
) {
  const ucWebPhonePage = await browserOrContext.newPage();

  await ucWebPhonePage.goto(`https://voice.ximasoftware.com/webphone/login`);
  await ucWebPhonePage
    .locator(`label:text-is("Login Name")+ div input`)
    .fill(agentWebphoneUsername);
  await ucWebPhonePage
    .locator(`label:text-is("Password")+ div input`)
    .fill(options.webphonePassword || process.env.WEBPHONE_PASSWORD);
  await ucWebPhonePage.locator(`button:text-is("Log In")`).click();

  // get past intro
  try {
    try {
      await ucWebPhonePage
        .getByRole(`button`, { name: `NEXT` })
        .click({ delay: 500 });
      await ucWebPhonePage
        .getByRole(`button`, { name: `NEXT` })
        .click({ delay: 500 });
      try {
        await ucWebPhonePage
          .getByRole(`button`, { name: `SKIP` })
          .click({ delay: 500, timeout: 3000 });
        await ucWebPhonePage
          .getByRole(`button`, { name: `SKIP` })
          .click({ delay: 500 });
      } catch {
        await ucWebPhonePage
          .getByRole(`button`, { name: `NEXT` })
          .click({ delay: 500 });
      }
      await ucWebPhonePage
        .getByRole(`button`, { name: `NEXT` })
        .click({ delay: 500 });
    } catch (err) {
      console.log(err);
    }
  } catch (err) {
    console.log(err);
  }
  return { ucWebPhonePage };
}

/**
 * Polls every 10s expected state before continuing test. If state not found within timeout, test will fail.
 * @param {Object} options - An object containing options for the scraper.
 * @param {string} options.id - Id of the state to poll
 * @param {string} options.expectedState - The state to expect before continuing on
 * @param {number} options.timeoutMinutes - Max wait time before failing test
 * @param {string} options.environment - defaults to QA Wolf Env ID
 * */
const waitForState = async (options = {}) => {
  // Imports
  const { axios } = npmImports;

  const {
    id,
    expectedState = "ready",
    timeoutMinutes = 5,
    environment = process.env.QAWOLF_ENVIRONMENT_ID,
  } = options;

  const pollOptions = {
    intervals: [10_000],
    timeout: timeoutMinutes * 60 * 1000,
  };

  await expect
    .poll(async () => {
      const { data } = await axios
        .post(
          "https://qawolf-automation.herokuapp.com/apis/statemachine/state",
          {
            api_key: process.env.QAWA_API_KEY,
            environment,
            id,
          },
        )
        .catch((e) => {
          throw new Error(e);
        });

      console.log(`Current state: ${data.state}`);

      return data.state;
    }, pollOptions)
    .toBe(expectedState);
};

/**
 * Get the current value of a state
 */
const getState = async (options = {}) => {
  // Imports
  const { axios } = npmImports;

  const { id, environment = process.env.QAWOLF_ENVIRONMENT_ID } = options;
  const { data } = await axios
    .post("https://qawolf-automation.herokuapp.com/apis/statemachine/state", {
      api_key: process.env.QAWA_API_KEY,
      environment,
      id,
    })
    .catch((e) => {
      throw new Error(e);
    });

  console.log(`Current state: ${data.state}`);

  return data.state;
};

/**
 *	Update the state machine
 * @param {Object} options - An object containing options for the scraper.
 * @param {string} options.id - Id of the state to poll
 * @param {string} options.state - The state to set
 * @param {string} options.environment - defaults to QA Wolf Env ID
 *	@returns {string} - Response from the state machine update
 */
const setState = async (options = {}) => {
  // Imports
  const { axios } = npmImports;

  const {
    id,
    state,
    environment = process.env.QAWOLF_ENVIRONMENT_ID,
  } = options;
  const res = await axios
    .post("https://qawolf-automation.herokuapp.com/apis/statemachine/update", {
      api_key: process.env.QAWA_API_KEY,
      environment,
      id,
      state,
    })
    .catch((e) => {
      throw new Error(e);
    });

  return res.response;
};

export async function logInSupervisor(options = {}) {
  // go to page
  const { browser, context } = await launch({ ...options });
  const page = await context.newPage();
  await staggerStart(page);
  await page.goto(buildUrl("/"));

  // fill out supervisor log in details
  // Adviced to now use Xima Agent 2, as Xima Agent 1 is now repurposed as a load balancer
  // https://qawolfhq.slack.com/archives/C03PG5DB4N9/p1668542417933249?thread_ts=1668541886.585929&cid=C03PG5DB4N9
  await page.fill(
    '[data-cy="consolidated-login-username-input"]',
    options.username || process.env.SUPERVISOR_USERNAME,
  );
  await page.fill(
    '[data-cy="consolidated-login-password-input"]',
    options.password || process.env.SUPERVISOR_PASSWORD,
  );
  await page.click('[data-cy="consolidated-login-login-button"]');
  // await expect(
  //   page.locator(':text("System Administrator"):right-of(div .initials)')
  // ).toBeVisible({ timeout: 60000 });

  // check app version
  try {
    await page.locator(`.initials`).hover();
    await page
      .getByRole(`button`, { name: `About` })
      .click({ timeout: 5 * 1000 });
  } catch (e) {
    await page.locator(`xima-user-menu`).getByRole(`button`).click();
    await expect(page.getByRole(`menuitem`, { name: `About` })).toBeVisible();
    await page.getByRole(`menuitem`, { name: `About` }).click();
  }

  // Version may switch
  // await expect(page.locator('[data-cy="about-ccaas-version"]')).toHaveText(
  //   "5.17(3-qawolf)"
  // );
  const version = await page.innerText('[data-cy="about-ccaas-version"]');
  console.log("XIMA CURRENT VERSION " + version);
  await setEnvironmentVariable("XIMA_VERSION", version);
  await expect(page.locator('[data-cy="about-ccaas-version"]')).toHaveText(
    // "5.18(1-qawolftest)"
    `${version}`,
  );

  await page.click('[data-cy="about-ccaas-ok"]');

  // assert logged in
  await expect(page.locator('[translationset="HOME_TITLE"]')).toHaveText(
    "Reports",
    { timeout: 30000 },
  );

  return { page, browser, context };
}

export async function loginTestManager(options = {}) {
  // go to page
  const { browser, context } = await launch({ ...options });
  const page = await context.newPage();
  await staggerStart(page);
  await page.goto(buildUrl("/"));

  // fill out supervisor log in details
  // Adviced to now use Xima Agent 2, as Xima Agent 1 is now repurposed as a load balancer
  // https://qawolfhq.slack.com/archives/C03PG5DB4N9/p1668542417933249?thread_ts=1668541886.585929&cid=C03PG5DB4N9
  await page.fill(
    '[data-cy="consolidated-login-username-input"]',
    options.username || process.env.XIMA_AGENT_2_EMAIL,
  );
  await page.fill(
    '[data-cy="consolidated-login-password-input"]',
    process.env.XIMA_AGENT_2_PASSWORD,
  );
  await page.click('[data-cy="consolidated-login-login-button"]');
  // await expect(
  //   page.locator(':text("System Administrator"):right-of(div .initials)')
  // ).toBeVisible({ timeout: 60000 });

  // check app version
  await page.click('[data-cy="home-component-arrow-drop-down-button"]');
  await page.click('[data-cy="home-component-menu-option-about-button"]');

  // Version may switch
  // await expect(page.locator('[data-cy="about-ccaas-version"]')).toHaveText(
  //   "5.17(3-qawolf)"
  // );
  const version = await page.innerText('[data-cy="about-ccaas-version"]');
  console.log("XIMA CURRENT VERSION " + version);
  await expect(page.locator('[data-cy="about-ccaas-version"]')).toHaveText(
    // "5.18(1-qawolftest)"
    `${version}`,
  );

  await page.click('[data-cy="about-ccaas-ok"]');

  // assert logged in
  await expect(page.locator('[translationset="HOME_TITLE"]')).toHaveText(
    "Reports",
    { timeout: 30000 },
  );

  return { page, browser, context };
}

// Stagger function
export async function staggerStart(page) {
  try {
    /**
     * Navigates to the specified URL.
     * @param {string} url - The URL to navigate to.
     * @returns {Promise<void>} A Promise that resolves once the navigation has completed.
     */
    await page.goto(
      "https://qawolf-automation.herokuapp.com/stagger/page/xima",
    );

    let countdown = parseInt(await page.innerText("#countdown")); // Initialize countdown variable

    while (countdown) {
      countdown = parseInt(await page.innerText("#countdown")); // Get the updated countdown value
      console.log(`Your test will begin in ${countdown} seconds.`);
      await page.waitForTimeout(1 * 1000);
    }
  } catch (error) {
    console.error("Failed to load the page:", error);
  }
}

export async function logInAgent(options = {}) {
  // go to page
  const { browser, context } = await launch({ ...options });
  const page = await context.newPage();
  await staggerStart(page);
  await page.goto(buildUrl("/"));

  // fill out agent log in details
  await page.fill(
    '[data-cy="consolidated-login-username-input"]',
    options.email || process.env.UCAGENT_1_EMAIL,
  );
  await page.fill(
    '[data-cy="consolidated-login-password-input"]',
    options.password || process.env.UCAGENT_1_PASSWORD,
  );
  await page.click('[data-cy="consolidated-login-login-button"]');
  await page.waitForTimeout(5000);

  // assert logged in
  if (await page.locator('[translationset="HOME_TITLE"]').isVisible()) {
    await page.hover('[data-mat-icon-name="external-link"]');
    // Handle popup
    const [page2] = await Promise.all([
      page.waitForEvent("popup"),
      page.click(':text("Agent Client")'),
    ]);
    await expect(page2.locator(".avatar-name-container")).toBeVisible();
    await expect(page2).toHaveURL(/\/ccagent/);
    await page.close();
    return { page: page2, browser, context };
  } else {
    await expect(page.locator(".avatar-name-container")).toBeVisible();
    await expect(page).toHaveURL(/\/ccagent/);
    return { page, browser, context };
  }
}

export async function logInWebRTCAgent(email, options = {}) {
  // go to page
  const { browser, context } = await launch({ ...options });
  const page = await context.newPage();
  await staggerStart(page);
  await page.goto(buildUrl("/"));

  // fill out agent log in details
  await page.fill('[data-cy="consolidated-login-username-input"]', email);
  await page.fill(
    '[data-cy="consolidated-login-password-input"]',
    process.env.WEBRTC_PASSWORD,
  );
  await page.click('[data-cy="consolidated-login-login-button"]');

  // assert logged in
  await expect(page.locator(".avatar-name-container")).toBeVisible();
  await expect(page).toHaveURL(/\/ccagent/);

  return { page, browser, context };
}

export async function logInPortal(options = {}) {
  const accounts = {
    agent: process.env.PORTAL_AGENT_EMAIL,
    supervisor: process.env.PORTAL_SUPERVISOR_EMAIL,
    admin: process.env.PORTAL_ADMIN_EMAIL,
  };
  const email =
    options.email ||
    accounts[options.account] ||
    process.env.PORTAL_AGENT_EMAIL;
  const password = options.password || process.env.PORTAL_DEFAULT_PASSWORD;

  // Load browser
  const { browser, context } = await launch({ ...options });

  // Create a page
  const page = await context.newPage();

  // Stagger start so test runs don't collide
  await staggerStart(page);

  // Go to the Login Portal
  await page.goto(process.env.PORTAL_URL);

  // Soft assert the company logo loads on the page
  await expect(
    page
      .getByRole(`img`, { name: `company-logo` })
      .or(page.getByRole(`img`, { name: `ccaas logo` })),
  ).toBeVisible();

  // Fill in the email address
  await page.getByRole(`combobox`, { name: `Email` }).fill(email);

  // Fill in the password
  await page
    .getByRole(`textbox`, { name: `Password` })
    .pressSequentially(password);

  // Click the "Login" button
  await page
    .getByRole(`button`, { name: `Log in` })
    .or(page.getByRole(`button`, { name: `Login` }))
    .click();

  return { page, browser, context };
}

export function buildUrl(route = "") {
  const baseUrl = (process.env.URL || process.env.DEFAULT_URL).replace(
    /\/$/,
    "",
  );

  return `${baseUrl}${route}`;
}

// used for getting a phone number to make outbound calls
export async function getOutBoundNumber(options = {}) {
  // Imports
  const { axios } = npmImports;

  let response = await axios.get(
    "https://livecallgeneration.ximasoftware.com/rest/calls/inbound-number",
    {
      headers: {
        "xima-token": process.env.XIMA_TOKEN,
      },
    },
  );
  return response.data;
}

// goes to autoattendant, and then you pick a skil with input digits, and call will go to anyone who has that skill enabled
export async function createCall(options = {}) {
  // Imports
  const { axios } = npmImports;

  let response = await axios.post(
    "https://livecallgeneration.ximasoftware.com/rest/calls/create",
    {
      number: options.number || "4352005133", //8016575831
      count: "1",
      "wait-on": "CONNECTED",
      timeout: "120",
    },
    {
      headers: {
        "Content-Type": "multipart/form-data",
        Accept: "application/json",
        "xima-token": process.env.XIMA_TOKEN,
      },
    },
  );
  let callId = response.data.callIds[0];
  return callId;
}
// this only goes to webRTC user 1, its a direct line
export async function createWebRTCCall() {
  // Imports
  const { axios } = npmImports;

  let response = await axios.post(
    "https://livecallgeneration.ximasoftware.com/rest/calls/create",
    {
      number: "4352285495",
      count: "1",
      "wait-on": "CONNECTED",
      timeout: "120",
    },
    {
      headers: {
        "Content-Type": "multipart/form-data",
        Accept: "application/json",
        "xima-token": process.env.XIMA_TOKEN,
      },
    },
  );
  let callId = response.data.callIds[0];
  return callId;
}

export async function inputDigits(callId, digits) {
  // Imports
  const { axios } = npmImports;

  try {
    let response = await axios.post(
      `https://livecallgeneration.ximasoftware.com/rest/calls/${callId}/press-digits?digits=${digits}`,
      {},
      {
        headers: {
          "Content-Type": "multipart/form-data",
          Accept: "application/json",
          "xima-token": process.env.XIMA_TOKEN,
        },
      },
    );
    console.log(response.status);
    let status = response.status;
    expect(status).toBe(200);
  } catch (err) {
    console.error(err.response ? err.response.data : err);
    throw new Error("ERROR INPUTTING DIGITS");
  }
}

export async function answerCall(page, handsetId) {
  let responseText = await page.evaluate(async (handsetId) => {
    function answerCallOnPage(handsetId) {
      return new Promise(function (resolve, reject) {
        let xhttp = new XMLHttpRequest();
        let url = `https://dev-bwhit.chronicallcloud-staging.com/rest/test-api/handset/${handsetId}/answer`;

        xhttp.open("POST", url);
        xhttp.setRequestHeader("Content-Type", "application/json");
        xhttp.onreadystatechange = function () {
          if (xhttp.readyState == XMLHttpRequest.DONE) {
            resolve(xhttp.responseText);
          }
        };
        xhttp.send();
      });
    }

    return await answerCallOnPage(handsetId);
  }, handsetId);

  console.log(responseText);
  let response = JSON.parse(responseText);
  return response.callId;
}

export async function dropCall(callId) {
  // Imports
  const { axios } = npmImports;

  let response = await axios.post(
    `https://livecallgeneration.ximasoftware.com/rest/calls/${callId}/drop`,
    {},
    {
      headers: {
        "Content-Type": "multipart/form-data",
        Accept: "application/json",
        "xima-token": process.env.XIMA_TOKEN,
      },
    },
  );
  let status = response.status;
  console.log(status);
  expect(status).toBe(202);
}

export async function unregisterAllHandsets(page) {
  let handsets = await getAllHandsets(page);
  let handsetIds = handsets.map((x) => x.handsetId);
  console.log(handsetIds);

  for (let handsetIdToUnregister of handsetIds) {
    await unRegisterHandset(page, handsetIdToUnregister);
  }
  handsets = await getAllHandsets(page);
  console.log(handsets);
}

export async function unRegisterHandset(page, handsetId) {
  let responseText = await page.evaluate(async (handsetId) => {
    function answerCallOnPage2(handsetId) {
      return new Promise(function (resolve, reject) {
        let xhttp = new XMLHttpRequest();
        let url = `https://dev-bwhit.chronicallcloud-staging.com/rest/test-api/handset/${handsetId}`;

        xhttp.open("DELETE", url);
        xhttp.setRequestHeader("Content-Type", "application/json");
        xhttp.onreadystatechange = function () {
          if (xhttp.readyState == XMLHttpRequest.DONE) {
            resolve(xhttp.responseText);
          }
        };
        xhttp.send();
      });
    }

    return await answerCallOnPage2(handsetId);
  }, handsetId);

  console.log(responseText);
}

export async function getAllHandsets(page) {
  let responseText = await page.evaluate(async () => {
    function getAllHandsetsOnPage() {
      return new Promise(function (resolve, reject) {
        let xhttp = new XMLHttpRequest();
        let url =
          "https://dev-bwhit.chronicallcloud-staging.com/rest/test-api/handset/";

        xhttp.open("GET", url);
        xhttp.setRequestHeader("Content-Type", "application/json");
        xhttp.onreadystatechange = function () {
          if (xhttp.readyState == XMLHttpRequest.DONE) {
            resolve(xhttp.responseText);
          }
        };
        xhttp.send();
      });
    }

    return await getAllHandsetsOnPage();
  });

  let response = JSON.parse(responseText);
  return response;
}

export async function registerHandset102(page) {
  let responseText = await page.evaluate(async () => {
    function sendJsonRequest() {
      return new Promise(function (resolve, reject) {
        let xhttp = new XMLHttpRequest();
        let url =
          "https://dev-bwhit.chronicallcloud-staging.com/rest/test-api/handset";
        let data = {
          username: "ximatest+101@ximasoftware.com",
          password: "P@ssw0rd",
          outbound_proxy: "SIP20.ringcentral.com",
          outbound_proxy_port: 5090,
          protocol: "TCP",
          extension: "102",
          authname: "802533505027",
          pbx_address: "sip.ringcentral.com",
          pbx_sip_port: 5060,
        };

        xhttp.open("POST", url);
        xhttp.setRequestHeader("Content-Type", "application/json");
        xhttp.onreadystatechange = function () {
          if (xhttp.readyState == XMLHttpRequest.DONE) {
            resolve(xhttp.responseText);
          }
        };
        xhttp.send(JSON.stringify(data));
      });
    }

    return await sendJsonRequest();
  });

  let response = JSON.parse(responseText);
  return response.handsetId;
}

export async function registerHandset501(page) {
  let responseText = await page.evaluate(async () => {
    function sendJsonRequest2() {
      return new Promise(function (resolve, reject) {
        let xhttp = new XMLHttpRequest();
        let url =
          "https://dev-bwhit.chronicallcloud-staging.com/rest/test-api/handset";
        let data = {
          username: "18013004043",
          password: "SbGJbPX",
          outbound_proxy: "SIP20.ringcentral.com",
          outbound_proxy_port: 5090,
          protocol: "TCP",
          extension: "501",
          pbx_address: "sip.ringcentral.com",
          pbx_sip_port: 5060,
          authname: 802817884026,
        };

        xhttp.open("POST", url);
        xhttp.setRequestHeader("Content-Type", "application/json");
        xhttp.onreadystatechange = function () {
          if (xhttp.readyState == XMLHttpRequest.DONE) {
            resolve(xhttp.responseText);
          }
        };
        xhttp.send(JSON.stringify(data));
      });
    }

    return await sendJsonRequest2();
  });

  let response = JSON.parse(responseText);
  return { handsetId: response.handsetId };
}

export async function downloadFile(page, selector) {
  const { readFile } = await import("node:fs/promises");
  page.on("dialog", async (dialog) => {
    await dialog.accept();
  });
  const [download] = await Promise.all([
    page.waitForEvent("download", { timeout: 5 * 60000 }),
    await page.click(selector),
  ]);
  const path = await download.path();
  const text = await readFile(path, "utf8");

  return text;
}

/**
 * Updated function to turn off all other skills except for 2 (used the most)
 */
export async function toggleStatusOn(page) {
  console.log("Starting to toggle status on.");

  // clean up media
  try {
    await page
      .locator("app-screen-pop-list-container")
      .click({ timeout: 5 * 1000 });
    await page.locator(`:text-is("End Screen Pop")`).click();
  } catch (err) {
    console.log(err);
  }

  // Function to toggle individual buttons if not already "on"
  async function toggleButton(dataCy) {
    if ((await page.locator(dataCy).count()) === 0) {
      console.log(`Button ${dataCy} does not exist on this page.`);
      return; // Skip if button does not exist
    }
    const button = page.locator(dataCy);
    const readyIcon = page
      .locator(`${dataCy}.ready`)
      .or(page.locator(`${dataCy} .ready`));
    const notReadyIcon = page
      .locator(`${dataCy}.channels-disabled`)
      .or(page.locator(`${dataCy} .channels-disabled`));

    if ((await notReadyIcon.count()) > 0) {
      console.log(`Toggling ${dataCy} button to 'on'.`);
      await button.click({ force: true }); // Force the click if the button is not in 'ready' state
      await page.waitForTimeout(2000); // Wait for the state to update
      try {
        await page
          .getByRole(`button`, { name: `Confirm` })
          .click({ timeout: 5000 });
      } catch (err) {
        console.error(err);
      }
      await expect(readyIcon).toHaveCount(1, { timeout: 10000 }); // Check if the button has toggled to 'ready'
      console.log(`${dataCy} button is confirmed to be 'on'.`);
    } else if ((await readyIcon.count()) > 0) {
      console.log(`${dataCy} button is already 'on'.`);
    } else {
      console.error(`Unable to determine the state of ${dataCy} button.`);
      throw new Error(
        `State of ${dataCy} button could not be determined. notReadyIcon.count = ${await notReadyIcon.count()} || readyIcon.count = ${await readyIcon.count()} ||`,
      );
    }
  }

  // Toggle DND if necessary
  const dndStatus = await page.locator('[class="dnd-status-text"]').innerText();
  if (dndStatus !== "Ready") {
    console.log(
      "DND toggle is currently 'off'. Attempting to click to turn it 'on'.",
    );
    await page
      .locator(`[class="dnd-status-container"] button`)
      .click({ force: true, delay: 500 });
    await page.getByRole(`menuitem`, { name: `Ready` }).click();
    console.log("DND toggle clicked to turn it 'on'.");
    await page.waitForTimeout(2000); // Wait for any UI updates
  } else {
    console.log("DND toggle is already 'on'. No action needed.");
  }

  // Confirm DND toggle is "on"
  console.log("Confirming the DND toggle is 'on'.");
  await expect(page.locator('[class="dnd-status-text"]')).toHaveText("Ready", {
    timeout: 7000,
  });

  // Check and toggle VOICE and CHAT buttons
  await page.waitForTimeout(1000);
  await toggleButton('[data-cy="channel-state-channel-VOICE"]');
  await page.waitForTimeout(1000);
  try {
    await toggleButton('[data-cy="channel-state-channel-CHAT"]');
  } catch (err) {
    console.log(err);
  }
  await page.waitForTimeout(1000);
  try {
    await toggleButton('[data-cy="channel-state-channel-EMAIL"]');
  } catch (err) {
    console.log(err);
  }
  await page.waitForTimeout(2000);

  console.log(
    "All toggles and channels are confirmed to be 'on'. Function completed.",
  );
}

export async function toggleStatusOff(page) {
  try {
    await page.click('[class="dnd-status-container"] button', {
      force: true,
      timeout: 3000,
    });
  } catch {
    await page
      .locator(".toggle-click-target")
      .click({ force: true, timeout: 3000 });
  }
  try {
    await page
      .getByRole(`menuitem`, { name: `Lunch` })
      .click({ timeout: 5 * 1000 });
  } catch {
    await page
      .getByRole(`menuitem`, { name: `Do Not Disturb` })
      .click({ timeout: 5 * 1000 });
  }
}

export async function toggleSkillsOn(page, skillNum) {
  await page.click('[data-cy="channel-state-manage-skills"]');
  await page.click(':text("All Skills Off")');
  await page.waitForTimeout(1000);
  await page.click(`span:text("Skill ${skillNum}") + mat-slide-toggle`);
  await page.waitForTimeout(1000);
  await page.click('[data-unit="close"]');
}

export async function toggleSpecificSkillsOn(page, skill) {
  await page.click('[data-cy="channel-state-manage-skills"]');
  await page.click(':text("All Skills Off")');
  await page.waitForTimeout(1000);
  await page.click(`[class*="skill"]:has-text("Skill ${skill}") input ~ span`);
  await page.waitForTimeout(1000);
  await page.click("xima-dialog-header button");
}

export async function toggleOnAllSkills(page) {
  await page.click('[data-cy="channel-state-manage-skills"]');
  await page.click(':text("All Skills On")');
  await page.click("xima-dialog-header button");
}

export async function toggleOffAllSkills(page) {
  await page.locator('[data-cy="channel-state-manage-skills"]').click();
  await page.locator(':text("All Skills Off")').click();
  await page.locator(`xima-dialog-header button[data-unit="close"]`).click();
}

export async function cleanupCheck(page) {
  try {
    await expect(
      page.locator('.schedule-list-item:has-text("Testing Add Report")'),
    ).not.toBeVisible({ timeout: 5000 });
  } catch {
    await page.waitForTimeout(3000);
    try {
      await page
        .locator(
          `.schedule-list-item:has-text("Testing Add Report") >> nth=0 >> [data-cy="reports-list-report-more-menu-button"]`,
        )
        .click({ timeout: 7000 });
      await page
        .locator('[data-cy="schedule-list-remove-schedule-button"]')
        .click();
      await page.waitForTimeout(3000);
      await page.click('[data-cy="confirmation-dialog-okay-button"]', {
        force: true,
        delay: 500,
      });
    } catch {
      await page.click(
        '.schedule-list-item:has-text("Testing Add Report") >> nth=0 >> [data-cy="schedule-list-remove-schedule-button"], [data-cy="schedule-list-remove-schedule-button"]',
        {
          force: true,
          delay: 500,
        },
      );
      await page.waitForTimeout(3000);
      await page.click('[data-cy="confirmation-dialog-okay-button"]', {
        force: true,
        delay: 500,
      });
    }

    // await expect(page.locator("xima-dialog h2")).toHaveText("Delete Schedule");
    await expect(
      page.locator(
        '[data-cy="schedule-list-schedule-title"]:text("Testing Add Report")',
      ),
    ).not.toBeVisible();
  }
}

export async function scheduleVerifyReportCleanupCheck(page) {
  try {
    await expect(
      page.locator(
        '.schedule-list-item:has-text("Schedule and Verify Report") >> nth=0',
      ),
    ).not.toBeVisible({ timeout: 5000 });
  } catch {
    await page.waitForTimeout(3000);
    try {
      await page
        .locator(
          `.schedule-list-item:has-text("Schedule and Verify Report") >> nth=0 >> [data-cy="reports-list-report-more-menu-button"]`,
        )
        .click({ timeout: 7000 });
      await page
        .locator('[data-cy="schedule-list-remove-schedule-button"]')
        .click();
      await page.waitForTimeout(3000);
      await page.click('[data-cy="confirmation-dialog-okay-button"]', {
        force: true,
        delay: 500,
      });
    } catch {
      await page.click(
        '.schedule-list-item:has-text("Schedule and Verify Report") >> nth=0 >> [data-cy="schedule-list-remove-schedule-button"], [data-cy="schedule-list-remove-schedule-button"]',
        {
          force: true,
          delay: 500,
        },
      );
      await page.waitForTimeout(3000);
      await page.click('[data-cy="confirmation-dialog-okay-button"]', {
        force: true,
        delay: 500,
      });
    }

    // await expect(page.locator("xima-dialog h2")).toHaveText("Delete Schedule");
    await expect(
      page.locator(
        '[data-cy="schedule-list-schedule-title"]:text("Testing Add Report")',
      ),
    ).not.toBeVisible();
    await expect(
      page.locator(
        '[data-cy="schedule-list-schedule-title"]:text("Schedule and Verify Report")',
      ),
    ).not.toBeVisible();
  }
}

export async function addMetric(page, metric) {
  await page.click('[data-cy="add-agent-metric-button"]');
  await page.click(':text("Select Metric")');
  await page.click(`:text('${metric}')`);
  await page.click('.metric-list button:has-text("Done")');
  await page.click('[data-cy="metric-parameters-dialog-apply"]');
}

export async function recordingMode(
  page2,
  mode = "Disabled",
  agentName = "WebRTC Agent 1",
) {
  // Navigate to Agent Licensing
  await page2.locator('[data-mat-icon-name="user-management"]').hover();
  await page2.getByRole(`button`, { name: `Agent Licensing` }).click();

  // Set recording to automatic for agent

  // Scroll agent into view and hover
  const agentNameCell = page2.locator(
    `[data-cy="user-license-management-user-cell"]:has-text("${agentName}")`,
  );
  await agentNameCell.scrollIntoViewIfNeeded();
  await agentNameCell.hover();

  // Click on the kebab menu
  await agentNameCell.locator(`.mat-mdc-icon-button`).click();

  // Click the "Edit" option
  await page2.getByRole(`menuitem`, { name: `Edit` }).click();

  // Open Recording Mode dropdown
  await page2.locator(`[formcontrolname="recordingMode"]`).click();

  // Select a recording mode
  await page2.getByRole(`option`, { name: mode, exact: true }).click();

  // Try to save flow
  try {
    await page2
      .locator('xima-agent-profile-dialog button:has-text("Save")')
      .click({
        timeout: 5000,
      });
    await expect(page2.getByRole(`button`, { name: `Ok` })).toBeEnabled();
    await page2.getByRole(`button`, { name: `Ok` }).click();
  } catch {
    await page2.locator('button[data-unit="close"]').click();
  }
}

export async function toggleSkill(page, skill) {
  await page.click('[data-cy="channel-state-manage-skills"]');
  await page.click(':text("All Skills Off")');
  await page.waitForTimeout(1000);
  await page.click(
    `[class*="skill"]:has-text("Skill ${skill}") [data-cy="skills-edit-dialog-skill-slide-toggle"] `,
  );
  await page.waitForTimeout(1000);
  await page.click('xima-dialog-header:text("Manage Skills") button');
  await page.bringToFront();
}

export async function changeDateToYesterday(page) {
  await page.waitForTimeout(3000);
  await page.click(':text("keyboard_arrow_left")');
  await page.waitForTimeout(3000);
  await page.click('[data-cy="reports-c2g-component-tab-ctog"]');
  await page.waitForTimeout(3000);
  await page.click(
    `[data-cy="'configure-report-preview-parameter-DATE_RANGE'"] [aria-label="Open calendar"]`,
  );
  // grab today's chosen date
  await page.waitForTimeout(3000);
  const defaultChosenDate = await page.innerText('[aria-pressed="true"]');
  const dayBeforeDefaultDate = defaultChosenDate - 1;
  console.log(dayBeforeDefaultDate);
  // click yesterday and today date range

  await page.click(
    `.mat-calendar-body-cell-content:has-text("${dayBeforeDefaultDate}")`,
  );
  await page.waitForTimeout(3000);
  await page.click('[aria-current="date"]');
  await page.waitForTimeout(3000);
  await page.click(
    '[data-cy="configure-cradle-to-grave-container-apply-button"]',
  ); // click apply
}

// clean up web chat helper
export async function endWebChat(page) {
  try {
    await expect(page.locator("text=Chat Offer")).toBeVisible();
    await page.click('[data-cy="alert-chat-offer-accept"]'); // accept
    await page.click('[data-cy="end-chat"]'); // end chat
    await page.click('[data-cy="call-details-finish-anchor"]'); // finish
  } catch (err) {
    console.log(err);
  }
}

// stagger helper
export function stagger(id) {
  // Imports
  const { axios } = npmImports;

  return new Promise((resolve, reject) => {
    console.log("Querying server for delay time...");

    const res = axios.get(
      `https://qawolf-automation.herokuapp.com/stagger/${id}`,
    );
    const delay = res.data.delay;

    console.log(`Waiting ${delay / 1000} seconds before starting...`);

    // delay -> 20s, 30s etc
    setTimeout(() => {
      resolve(delay);
    }, delay);
  });
}

// staggering supervisor login
export async function logInStaggeringSupervisor(options = {}) {
  // go to page
  const { browser, context } = await launch({ ...options });

  // stagger
  const page = await context.newPage();
  await staggerStart(page);
  await page.goto(buildUrl("/"));

  // fill out supervisor log in details
  // Adviced to now use Xima Agent 2, as Xima Agent 1 is now repurposed as a load balancer
  // https://qawolfhq.slack.com/archives/C03PG5DB4N9/p1668542417933249?thread_ts=1668541886.585929&cid=C03PG5DB4N9
  await page.fill(
    '[data-cy="consolidated-login-username-input"]',
    options.username || process.env.SUPERVISOR_USERNAME,
  );
  await page.fill(
    '[data-cy="consolidated-login-password-input"]',
    options.password || process.env.SUPERVISOR_PASSWORD,
  );
  await page.click('[data-cy="consolidated-login-login-button"]');
  // await expect(
  //   page.locator(':text("System Administrator"):right-of(div .initials)')
  // ).toBeVisible({ timeout: 60000 });

  // check app version
  try {
    await page.locator(`.initials`).hover();
    await page
      .getByRole(`button`, { name: `About` })
      .click({ timeout: 5 * 1000 });
  } catch (e) {
    await page.locator(`xima-user-menu`).getByRole(`button`).click();
    await expect(page.getByRole(`menuitem`, { name: `About` })).toBeVisible();
    await page.getByRole(`menuitem`, { name: `About` }).click();
  }
  // Version may switch
  // await expect(page.locator('[data-cy="about-ccaas-version"]')).toHaveText(
  //   "5.17(3-qawolf)"
  // );
  const version = await page.innerText('[data-cy="about-ccaas-version"]');
  console.log("XIMA CURRENT VERSION " + version);
  await expect(page.locator('[data-cy="about-ccaas-version"]')).toHaveText(
    // "5.18(1-qawolftest)"
    `${version}`,
  );

  await page.click('[data-cy="about-ccaas-ok"]');

  // assert logged in
  await expect(page.locator('[translationset="HOME_TITLE"]')).toHaveText(
    "Reports",
    { timeout: 30000 },
  );

  return { page, browser, context };
}

export async function liveListen(page, agent) {
  // attempt to live listen to agent
  await page
    .locator(
      `app-agent-status-container:has-text("${agent}") [data-cy="agent-tile-more-menu"]`,
    )
    .click();

  // click Call Monitoring
  await page.click(':text-is("Call Monitoring")');

  // // if we get a replace supervisor message, retry in 10 seconds
  // const loc = page.locator(':text("Replace Supervisor")');
  // let i = 0;
  // while ((await loc.count()) && i < 20) {
  //   // wait 10 seconds
  //   await page.waitForTimeout(10 * 1000);

  //   // press cancel
  //   await page.click(':text("Cancel")');

  //   // listen again
  //   await page.click(
  //     `mat-card:has-text("${agent}") [data-cy="agent-tile-more-menu"]`
  //   );

  //   // click Call Monitoring
  //   await page.click(':text-is("Call Monitoring")');
  // }
}

export async function downloadS3File(page, file) {
  // Imports
  const { faker } = npmImports;
  const { rename } = await import("node:fs/promises");

  const extension = file.split(".")[1];
  const fileUrl = `https://qawolf-customer-assets.s3.us-east-2.amazonaws.com/xima/${file}`;
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.goto(fileUrl).catch(() => {}),
  ]);

  const path = await download.path();
  if (extension) {
    const newPath = `/tmp/${faker.random.alphaNumeric()}.${extension}`;
    await rename(path, newPath);
    return newPath;
  }

  return path;
}

// @params id = unique email id, extension = unique 3 digit extension
const createNewWebRTCAgent = async (id, extension, options = {}) => {
  // REQ01 Login as Supervisor
  const { context, page } = await logInSupervisor();

  const { email, waitForMessage } = getInbox({ id: id });

  // REQ182 Navigate to Agent Licensing (WebRTC)
  await page.hover('[data-mat-icon-name="user-management"]');
  await page.click('.mat-menu-item:has-text("Agent Licensing")');

  await expect(page).toHaveURL(/agent-license-management/);

  // REQ183 Able to create a WebRTC agent
  const agentName = options.agentName || `newAgent ${Date.now()}`;
  await page.waitForTimeout(3000);
  await page.click('button:has-text("Add Agent")');
  await page.fill('[placeholder="Add Name"]', agentName);
  await page.fill('[placeholder="Add email"]', email);
  await page.fill('[placeholder="Add extension"]', extension);

  let extensionNum = Number(extension);
  while (
    await page
      .locator(
        'div.extension-in-use:has-text("Warning: Extension already in use")',
      )
      .isVisible()
  ) {
    extensionNum += 1;
    await page.fill('[placeholder="Add extension"]', String(extensionNum));
    await page.waitForTimeout(3000);
  }
  const newExtension = String(extensionNum);
  const after = new Date();
  await page.click('.cdk-overlay-container button:has-text("Save")');
  await page.click('button:has-text("Ok")');

  // assert agent added to table
  await expect(async () => {
    await page.reload();
    await expect(
      page.locator(`mat-row:has-text("${agentName}")`),
    ).toBeVisible();
  }).toPass({ timeout: 1000 * 60 * 2 });
  await page.waitForTimeout(2000);
  try {
    await expect(
      page.locator(
        `[role="row"]:has-text("${agentName}") [data-cy="user-license-management-license-selection-CCAAS_VOICE"] input`,
      ),
    ).toBeChecked({ timeout: 5000 });
  } catch {
    await page.click(
      `[role="row"]:has-text("${agentName}") [data-cy="user-license-management-license-selection-CCAAS_VOICE"] label`,
    );
    await page.click(
      `[role="row"]:has-text("${agentName}") [for*="mat-checkbox"]`,
    );
  }
  await page.click('[data-cy="user-license-management-save-button"]');
  await page.waitForTimeout(3000);
  try {
    await page.click('[data-cy="user-license-management-save-button"]');
  } catch (err) {
    console.log(err);
  }

  // REQ184 Assert welcome email is sent to newly created user
  await page.waitForTimeout(10000);
  const message = await waitForMessage({ after });

  expect(
    message.text.includes("Your account has been successfully created"),
  ).toBe(true);

  // Set password
  const passwordPage = await context.newPage();
  await passwordPage.waitForTimeout(2000);
  await passwordPage.goto(message.urls[0]);

  await expect(passwordPage).toHaveURL(/password/);

  const password = process.env.WEBRTC_PASSWORD;

  await passwordPage.fill("#psw", password);
  await passwordPage.fill("#confirm-password", password);

  await page.waitForTimeout(5000);

  await passwordPage.click(".set-password-btn");

  // REQ188 After setting up new password you are auto directed to WebRTC agent dashboard
  await passwordPage.click('button:has-text("Back to main page")');
  // await passwordPage.click('button:has-text("Got it")');
  await expect(passwordPage).toHaveURL(/ccagent/);
  await expect(passwordPage.locator(".name").first()).toHaveText(agentName);

  try {
    await passwordPage.click(':text("Got it")');
  } catch (err) {
    console.log(err);
  }

  return { email, extension: newExtension };
};

// Deletes all reports with given reportPrefix
// @params page, reportPrefix
export async function cleanUpReports(page, reportPrefix) {
  // Navigate to reports page
  await page.goto(
    "https://dev-bwhit.chronicallcloud-staging.com/web/reports/all",
  );

  // Wait for at least one table row to load
  await page.locator('div.mat-sort-header-content:text-is("Name")').waitFor();
  await page.locator("mat-row").first().waitFor();

  // Get the current count of reports with the given reportPrefix
  let reportCount = await page
    .locator(`mat-row:has-text("${reportPrefix}")`)
    .count();

  // Declare attempts variable so that while loop stops if there's an error
  let attempts = 0;

  // Delete first row/report with given reportPrefix until count is 0
  while (reportCount && attempts < 30) {
    // Get name of the report we're deleting
    const currReportName = await page
      .locator(`mat-row:has-text("${reportPrefix}")`)
      .first()
      .locator('[data-cy="reports-list-report-name"]')
      .innerText();

    // Delete report
    await page.click(
      `mat-row:has-text("${reportPrefix}") [data-mat-icon-name="more-v1"]`,
    );
    await page.click('[data-cy="reports-list-more-menu-delete-button"]');
    await page.click('[data-cy="confirmation-dialog-okay-button"]');

    // Wait for report to be deleted, not visible on table
    await page
      .locator(`mat-row:has-text("${currReportName}")`)
      .waitFor({ state: "hidden" });

    // Update report count
    reportCount = await page
      .locator(`mat-row:has-text("${reportPrefix}")`)
      .count();
  }
  console.log(`Cleanup done! ${attempts} reports deleted.`);
}

const cleanUpWallBoardsNotStrict = async (page, wallBoardName) => {
  // this function will search for all wallboards that partially match the wallBoardName
  // and then it will click to delete each one and then recheck until
  // the only occurance of the wallboard name is the search bar...

  // everything except final assertion is in a loop because
  // wallboards will randomly load if there are too many.

  await expect(async () => {
    await page.waitForTimeout(5000);
    await page.fill('[placeholder="Type to Search"]', wallBoardName);
    await page.keyboard.press("Enter");
    while (await page.getByText(wallBoardName).count()) {
      let currentCount = await page.getByText(wallBoardName).count();
      await page.click(
        `.wallboard-card:has-text("${wallBoardName}") [data-cy="realtime-wallboards-item-menu-button"] >> nth=0`,
      );
      // await page.getByText("4 Skills").locator('[data-cy="realtime-wallboards-item-menu-button"] >> nth=0').click();
      await page.waitForTimeout(1000);
      await page.getByRole(`menuitem`, { name: `Delete` }).click();
      await page.waitForTimeout(1000);
      await page.locator('[data-cy="confirmation-dialog-okay-button"]').click();
      await expect(page.getByText(wallBoardName)).toHaveCount(
        currentCount - 1,
        { timeout: 15000 },
      );
    }
  }).toPass({ timeout: 300000 });

  await expect(page.getByText(wallBoardName)).toHaveCount(0);
};

export function generateTwilioSignature(url, params, authToken) {
  const data = Object.keys(params)
    .sort()
    .reduce((acc, key) => acc + "&" + key + "=" + params[key], url);
  console.log("data:", data);
  return crypto.createHmac("sha1", authToken).update(data).digest("base64");
}

export function initiateStartCall(endpoint, options) {
  // Imports
  const { https } = npmImports;

  return new Promise((resolve, reject) => {
    const req = https.request(endpoint, options, (res) => {
      let data = "";

      // Collect response data
      res.on("data", (chunk) => {
        data += chunk;
      });

      // On end, parse and resolve the Call SID if present
      res.on("end", () => {
        if (res.statusCode === 200 || res.statusCode === 202) {
          const contentType = res.headers["content-type"];
          if (contentType && contentType.includes("application/json")) {
            // Attempt to parse JSON if response was successful
            try {
              const responseData = JSON.parse(data);
              if (responseData && responseData.includes("Call initiated:")) {
                const callSid = responseData.split("Call initiated: ")[1];
                resolve(callSid);
              } else {
                reject("Response received, but no Call SID found");
              }
            } catch (error) {
              reject(`Error parsing JSON response: ${data}`);
            }
          } else {
            // Handle plain text response
            if (data.includes("Call initiated:")) {
              const callSid = data.split("Call initiated: ")[1];
              resolve(callSid);
            } else {
              reject("Response received, but no Call SID found");
            }
          }
        } else {
          reject(`Request failed with status ${res.statusCode}: ${data}`);
        }
      });
    });

    // Handle request errors
    // Handle request errors
    req.on("error", (error) => {
      reject(`Request error: ${error.message}`);
    });

    // End the request
    req.end();
  });
}

export function buildOptions(method, signature) {
  const options = {
    method,
    headers: {
      Authorization: process.env.TWILIO_AUTH_TOKEN,
      "Content-Type": "application/json",
      "X-Twilio-Signature": signature,
    },
  };

  return options;
}

export function checkCallResults(endpoint, options) {
  // Imports
  const { https } = npmImports;

  return new Promise((resolve, reject) => {
    const req = https.request(endpoint, options, (res) => {
      let data = "";

      // Collect response data
      res.on("data", (chunk) => {
        data += chunk;
      });

      // On end, parse and resolve the results if present
      res.on("end", () => {
        if (res.statusCode === 200 || res.statusCode === 202) {
          const contentType = res.headers["content-type"];
          if (contentType && contentType.includes("application/json")) {
            // Attempt to parse JSON if response was successful
            try {
              const responseData = JSON.parse(data);
              resolve(responseData);
            } catch (error) {
              reject(`Error parsing JSON response: ${data}`);
            }
          } else {
            // Handle plain text response
            resolve(data);
          }
        } else {
          reject(`Request failed with status ${res.statusCode}: ${data}`);
        }
      });
    });

    // Handle request errors
    req.on("error", (error) => {
      reject(`Request error: ${error.message}`);
    });
    // End the request
    req.end();
  });
}

export function pollCallStatus(callSid, client) {
  return new Promise((resolve, reject) => {
    const poll = async () => {
      try {
        const callDetails = await client.calls(callSid).fetch();
        console.log("Call status:", callDetails.status);

        if (
          callDetails.status === "completed" ||
          callDetails.status === "failed"
        ) {
          resolve(callDetails);
        } else {
          setTimeout(() => {
            poll().catch(reject);
          }, 5000); // Poll every 5 seconds
        }
      } catch (error) {
        reject(`Error fetching call status: ${error.message}`);
      }
    };

    poll().catch(reject);
  });
}

export function parseTimeToToday(timeString) {
  // Imports
  const { dateFns } = npmImports;

  const today = new Date();
  return dateFns.parse(timeString, "h:mm:ss a", today);
}

export function sortTimesDescending(timeStrings) {
  // Imports
  const { dateFns } = npmImports;

  return timeStrings.sort((a, b) => {
    const timeA = dateFns.parse(a, "h:mm:ss a", new Date());
    const timeB = dateFns.parse(b, "h:mm:ss a", new Date());

    return timeB - timeA;
  });
}

export function findClosestTime(targetTimeString, timeStrings) {
  // Imports
  const { dateFns } = npmImports;

  const targetTime = parseTimeToToday(targetTimeString);

  const sortedTimestrings = sortTimesDescending(timeStrings);

  console.log("[TARGET_TIME]", targetTime);

  for (const timeString of sortedTimestrings) {
    const currentTime = parseTimeToToday(timeString);
    const difference = Math.abs(
      dateFns.differenceInSeconds(targetTime, currentTime),
    );

    if (difference <= 10) {
      return timeString;
    }
  }

  return null;
}

export async function setFilter({
  page,
  startFilterTime = null,
  channel = null,
  agent = null,
  skill = null,
  criteria = [],
}) {
  if (channel) {
    await page
      .locator(`app-configure-report-preview-parameter`)
      .filter({ hasText: `Channels 0 Selected` })
      .getByRole(`button`)
      .click();
    await page.getByText(channel).click();
    await page.getByRole(`button`, { name: `Apply` }).click();
  }

  if (agent) {
    await page
      .locator(`app-configure-report-preview-parameter`)
      .filter({ hasText: `Agent 0 Selected` })
      .getByRole(`button`)
      .click();
    await page.getByText(agent).click();
    await page.getByRole(`button`, { name: `Apply` }).click();
  }

  if (skill) {
    await page
      .locator(`app-configure-report-preview-parameter`)
      .filter({ hasText: `Skill 0 Selected` })
      .getByRole(`button`)
      .click();
    await page
      .locator(`[data-cy="checkbox-tree-property-option"] :text("${skill}")`)
      .click();
    await page.getByRole(`button`, { name: `Apply` }).click();
  }

  if (startFilterTime) {
    await page
      .locator(
        `[data-cy="xima-criteria-selector-container"] [data-cy="xima-header-add-button"]`,
      )
      .click();

    await page
      .locator(
        `[data-cy="xima-criteria-selector-container"] [data-cy="xima-criteria-selector-search-input"]`,
      )
      .click();

    await page.getByText(`Time of Day`).click();
    await page
      .getByPlaceholder(`Start Time`)
      .fill(`${startFilterTime.split(" ")[0]}`);
  }

  if (criteria.length) {
    await page
      .locator(
        `[data-cy="xima-criteria-selector-container"] [data-cy="xima-header-add-button"]`,
      )
      .click();

    for (const item of criteria) {
      // Validate criteria before processing
      for (const item of criteria) {
        if (
          !item.name ||
          !Array.isArray(item.values) ||
          item.values.length === 0
        ) {
          throw new Error(
            `Invalid criteria item: Each item must include 'name' (string) and 'values' (non-empty array). Received: ${JSON.stringify(item)}`,
          );
        }
      }

      if (item.name === "Call Does Not Include Skill") {
        await page
          .locator(
            `[data-cy="xima-criteria-selector-container"] [data-cy="xima-criteria-selector-search-input"]`,
          )
          .click();
        await page.getByText(`Call Does Not Include Skill`).click();
        await page
          .locator(
            `[data-cy="criteria-selector-parameter"] [data-cy="xima-preview-input-edit-button"]`,
          )
          .click();

        await page.waitForTimeout(1000);

        for (const value of item.values) {
          if (value === "All") {
            await page
              .locator(`[data-cy="checkbox-tree-property-select-all"]`)
              .click();
          } else {
            await page
              .locator(
                `[data-cy="checkbox-tree-property-option"] :text("${value}")`,
              )
              .click();
          }
        }
      }
    }
    await page.waitForTimeout(3000);
    await page.locator(`[data-cy="checkbox-tree-dialog-apply-button"]`).click();
  }

  await page
    .locator(
      `[data-cy="configure-cradle-to-grave-container-apply-button"]:has-text("Apply")`,
    )
    .click();
}

/**
 * Attempt to monitor an Agent's call
 *
 * Made based off of old comments, please update based on new context, if available!
 *
 * @param {Page} supervisorPage -> This function only works on a supervisor's page
 * @param {Object} options
 * @param {Number} options.agentNum -> Number of Agent to monitor
 */

export async function monitorCall(supervisorPage, options = {}) {
  //!! Click on the kebab menu button on the Agent's tile from "WebRTC Agent"
  await supervisorPage
    .locator(
      `app-agent-status-container:has-text("WebRTC Agent ${options.agentNum} (") [data-cy="agent-tile-more-menu"]`,
    )
    .waitFor();
  await supervisorPage
    .locator(
      `app-agent-status-container:has-text("WebRTC Agent ${options.agentNum} (") [data-cy="agent-tile-more-menu"]`,
    )
    .click({ delay: 300 });

  //!! Click on the 'Call Monitoring' option on the Supervisor's page
  await supervisorPage
    .getByRole(`menuitem`, { name: `Call Monitoring` })
    .click();

  // Replace if we need to
  try {
    await supervisorPage.click(".confirm-replace", { timeout: 5000 });
  } catch (e) {
    console.error(e);
  }

  //!! Check if "Call Monitoring Active" is visible on the Supervisor's page. If not, repeat steps from line 8, including clicking the "confirm-replace" button
  try {
    await expect(
      supervisorPage.getByText(`Call Monitoring Active:`),
    ).toBeVisible();
  } catch (err) {
    //!! Click on the kebab menu button on the Agent's tile from "WebRTC Agent"
    await supervisorPage
      .locator(
        `app-agent-status-container:has-text("WebRTC Agent ${options.agentNum} (") [data-cy="agent-tile-more-menu"]`,
      )
      .waitFor();
    await supervisorPage
      .locator(
        `app-agent-status-container:has-text("WebRTC Agent ${options.agentNum} (") [data-cy="agent-tile-more-menu"]`,
      )
      .click({ delay: 300 });

    //!! Click on the 'Call Monitoring' option on the Supervisor's page
    await supervisorPage
      .getByRole(`menuitem`, { name: `Call Monitoring` })
      .click({ delay: 300 });

    // Replace if we need to
    await supervisorPage.click(".confirm-replace", { timeout: 5000 });
  }
}

/**
 * Filters for a specific Agent, or for all agents if a name is not passed
 *
 * Assumes:
 *  - You're logged in as a supervisor.
 *  - You're on the "Supervisor View" tab.
 *  - You have not opened the filter tab already.
 *
 * Can receive these optional params:
 *  - `options.agentName` -> Name of the agent to filter by.
 *  - `options.clearFilters` -> If you want 0 agents to be selected.
 *                             Should not be passed alongside an `agentName`,
 *                             as passing a name will clear filters anyway.
 *  - `options.displayOffline` -> If offline agents should be included.
 *
 * @param {Page} supervisorPage
 * @param {object} options
 * @param {string} options.agentName
 * @param {boolean} options.clearFilters
 * @param {boolean} options.displayOffline
 */
export async function supervisorFilterAgents(supervisorPage, options = {}) {
  // Click filter icon
  await supervisorPage
    .locator('[data-cy="supervisor-view-filter-title"]')
    .click();

  // Soft assert "Filter Agents" is visible
  await expect(supervisorPage.getByText(`Filter Agents`)).toBeVisible();

  // Click the edit icon for "Agents"
  await supervisorPage
    .locator(
      '[data-cy="configure-report-preview-parameter-container"]:has-text("Agents") [data-cy="xima-preview-input-edit-button"]',
    )
    .click();

  // Soft assert "Search Agents" modal appears
  await expect(
    supervisorPage.locator(`cdk-dialog-container:has-text("Search Agents")`),
  ).toBeVisible();

  // Check the "Select All Agents" checkbox to clear previous filter
  await supervisorPage
    .locator('[data-cy="xima-list-select-select-all"] [type="checkbox"]')
    .check();

  if (options.agentName) {
    // Uncheck "Select All Agents" checkbox to ensure no agents are selected
    await supervisorPage
      .locator('[data-cy="xima-list-select-select-all"] [type="checkbox"]')
      .uncheck();

    // Search for our agent
    await supervisorPage
      .getByRole(`textbox`, { name: `Search Agents` })
      .fill(options.agentName);

    // Select our agent
    await supervisorPage
      .getByRole(`option`, { name: options.agentName })
      .click();

    // Soft assert only 1 agent is selected
    await expect(supervisorPage.getByText(`1 Agents Selected`)).toBeVisible();
  }

  if (options.clearFilters) {
    // Uncheck "Select All Agents" checkbox to ensure no agents are selected
    await supervisorPage
      .locator('[data-cy="xima-list-select-select-all"] [type="checkbox"]')
      .uncheck();
  }

  // Click the "Apply" button in the modal
  await supervisorPage
    .locator(`[data-cy="agents-roles-dialog-apply-button"]`)
    .click();

  // Soft assert the modal has closed
  await expect(
    supervisorPage.locator(`cdk-dialog-container:has-text("Search Agents")`),
  ).not.toBeVisible();

  if (options.displayOffline) {
    // Ensure "Display Offline Agents" is checked
    await supervisorPage
      .locator(
        `[data-cy="supervisor-view-agent-offline-checkbox"]  [type="checkbox"]`,
      )
      .check();
  } else {
    // Ensure "Display Offline Agents" is not checked
    await supervisorPage
      .locator(
        `[data-cy="supervisor-view-agent-offline-checkbox"]  [type="checkbox"]`,
      )
      .uncheck();
  }

  // Click the "Apply" button in the filter menu
  await supervisorPage
    .locator('[data-cy="supervisor-view-filter-apply-button"]')
    .click();
}

/**
 * Toggles skills for an Agent.
 *
 * Assumes:
 *  - You're logged in as a supervisor.
 *  - You're on the "Supervisor View" tab.
 *  - The agent to edit is already filtered for and visible.
 *
 * If an `agentName` is passed, that agent's kebab menu will be
 * clicked and the "Toggle Skills" menu option will be clicked.
 *
 * If not, the function assumes this menu is already open.
 *
 * If a `skillName` is passed, only that skill will be toggled.
 * "On" or "off" depends on the skill's current state.
 * Other skills will remain untouched.
 *
 * If `allOn` is passed, all skills will be turned on.
 * If `allOff` is passed, all skills will be turned off.
 *
 * These run BEFORE toggling `skillName`, so using these
 * together provides control over what ends up on/off.
 *
 * Can receive these optional params:
 *  - `options.agentName` -> Name of agent to edit.
 *  - `options.skillName` -> Name of skill to toggle.
 *  - `options.allOn` -> If you want all skills to be turned on.
 *  - `options.allOff` -> If you want all skills to be turned off.
 *
 * @param {Page} supervisorPage
 * @param {object} options
 * @param {string} options.agentName
 * @param {string} options.skillName
 * @param {boolean} options.allOn
 * @param {boolean} options.allOff
 */
export async function supervisorToggleAgentSkills(supervisorPage, options = {}) {
  if (options.agentName) {
    // Click the Kebab menu on the Agent matching `agentName`
    await supervisorPage
      .locator(
        `app-agent-status-container:has-text("${options.agentName}") [data-cy="agent-tile-more-menu"]`,
      )
      .click();

    // Click on the "Toggle Skills" menu option
    await supervisorPage
      .getByRole(`menuitem`, { name: `Toggle Skills` })
      .click();
  }

  // Store "Toggle All" selector
  const toggleAll = supervisorPage.locator(
    `[data-cy="agent-skills-item-slider-toggle-all"]`,
  );

  // If all skills should be turned on
  if (options.allOn) {
    // Soft assert that they're already all on
    try {
      await expect(toggleAll.locator(`[aria-checked="true"]`)).toBeVisible({
        timeout: 2 * 1000,
      });
    } catch (e) {
      // If they aren't, click "Toggle All" on
      await toggleAll.click();

      // Soft assert that they are now all toggled on
      await expect(toggleAll.locator(`[aria-checked="true"]`)).toBeVisible({
        timeout: 2 * 1000,
      });
    }
  }

  // If all skills should be turned on
  if (options.allOff) {
    // Soft assert that they're already all on
    try {
      await expect(toggleAll.locator(`[aria-checked="false"]`)).toBeVisible({
        timeout: 2 * 1000,
      });
    } catch (e) {
      // If they aren't, click "Toggle All" on
      await toggleAll.click();

      // Soft assert that they are now all toggled on
      await expect(toggleAll.locator(`[aria-checked="false"]`)).toBeVisible({
        timeout: 2 * 1000,
      });
    }
  }

  if (options.skillName) {
    // Toggle option matching `skillName`
    await supervisorPage
      .locator(`form div`)
      .filter({ hasText: options.skillName })
      .locator("mat-slide-toggle")
      .click();
  }

  // Click the "Ok" button
  await supervisorPage.getByRole(`button`, { name: `Ok` }).click();
}

/**
 * Alerts the owning team in Slack when non-essential cleanups fail in
 * workflow runs instead of failing workflows.
 *
 * Wrap all the cleanup actions in a try/catch and call
 * `await reportCleanupFailed()` in the catch.
 *
 * Can receive these optional params:
 * - `options.dedupKey` -> Function name that failed. Subsequent failures
 *                         of the same function won't send alerts.
 * - `options.errorMsg` -> Error text that will be included in the Slack message.
 *
 * @param {Object} options
 * @param {string} options.dedupKey
 * @param {string} options.errorMsg
 *
 * Context: https://www.notion.so/qawolf/API-based-clean-up-7aa8b322852e466aa9808b02421fae27?pvs=4
 */
export async function reportCleanupFailed({ dedupKey, errorMsg } = {}) {
  // Construct payload
  const payload = {
    runId: process.env.QAWOLF_RUN_ID,
    teamId: process.env.QAWOLF_TEAM_ID,
    workflowId: process.env.QAWOLF_WORKFLOW_ID,
    suiteId: process.env.QAWOLF_SUITE_ID,
    dedupKey,
    errorMsg,
  };

  // Prevents alerts when running in editor (RUN_ID will be undefined)
  if (!payload.runId) return;

  // Make a POST to the Cleanup Failure API to report failure
  const CLEANUP_API_URL =
    "https://qawolf-automation.herokuapp.com/apis/cleanup-fail";
  try {
    const response = await fetch(CLEANUP_API_URL, {
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });

    // If response is okay
    if (response.ok) {
      // Parse and return response
      return await response.json();
    }

    // Throw error is response is NOT ok
    throw Error(`HTTP error! Status: ${response.status}`);
  } catch (error) {
    // Throw if an error occurs during fetch or parsing response
    throw Error(`Fetch or parsing error! ${error.message}`);
  }
}

/**
 * Cleanup chat offers and chats in Active media
 * @param {Page} page
 */
export async function cleanupChats(page) {
  // Cleanup chat Offers
  let attempts = 0;
  while (
    (await page.getByRole(`button`, { name: "Accept" }).last().isVisible()) &&
    attempts < 10
  ) {
    // Accept chat offer
    await page.getByRole(`button`, { name: "Accept" }).last().click();
    await page.waitForTimeout(1500);
    attempts++;
  }

  // Cleanup chats in Active Media
  attempts = 0;
  while (
    (await page.locator(`xima-active-media-tile`).isVisible()) &&
    attempts < 5
  ) {
    // Click Chat under Active Media
    await page.locator(`xima-active-media-tile`).click();
    // Click End Chat
    await page
      .getByRole(`button`, { name: `End Chat` })
      .click({ timeout: 5000 });
    // Click Close
    await page.getByRole(`button`, { name: `Close` }).click();
    attempts++;
  }
}
