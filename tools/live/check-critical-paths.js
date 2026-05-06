const { chromium } = require('C:/Users/Julia/Desktop/Lashesbyliaxopencode/node_modules/.pnpm/playwright-core@1.59.1/node_modules/playwright-core');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const targetUrl = 'http://127.0.0.1:4173/dashboard.html';

async function textOrNull(page, selector) {
  const node = page.locator(selector).first();
  return (await node.count()) ? (await node.textContent())?.trim() : null;
}

async function clickAndCheck(page, buttonSelector, probeSelector, name) {
  const button = page.locator(buttonSelector).first();
  const exists = await button.count();
  if (!exists) {
    return { name, ok: false, reason: 'button-missing' };
  }

  try {
    await button.click({ force: true });
    await page.waitForTimeout(350);
  } catch (error) {
    return { name, ok: false, reason: `click-error:${error.message}` };
  }

  const probe = page.locator(probeSelector).first();
  const probeVisible = (await probe.count()) ? await probe.isVisible().catch(() => false) : false;
  return { name, ok: probeVisible, reason: probeVisible ? 'opened' : 'not-opened' };
}

async function main() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: edgePath
  });

  const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
  const consoleMessages = [];
  const pageErrors = [];

  page.on('console', (msg) => {
    consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
  });
  page.on('pageerror', (err) => {
    pageErrors.push(err.message);
  });

  await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });

  await page.fill('#loginEmail', 'julia@lashes-by-lia.de');
  await page.fill('#loginPassword', 'Julia2026!');
  await page.click('#loginForm button[type="submit"]');
  await page.waitForTimeout(2200);

  const dashboardView = page.locator('#dashboardApp').first();
  const loginOk = (await dashboardView.count()) ? await dashboardView.isVisible().catch(() => false) : false;
  if (!loginOk) {
    const loginError = await textOrNull(page, '#loginError');
    const loginSuccess = await textOrNull(page, '#loginSuccess');
    const dashboardHidden = await page.locator('#dashboardApp.hidden').count();
    const loginHidden = await page.locator('#loginSection.hidden').count();
    console.log(JSON.stringify({
      login: 'failed',
      loginError,
      loginSuccess,
      dashboardHidden: !!dashboardHidden,
      loginHidden: !!loginHidden,
      consoleMessages,
      pageErrors
    }, null, 2));
    await browser.close();
    return;
  }

  const results = [];
  const initialDomInfo = await page.evaluate(() => ({
    tabIds: Array.from(document.querySelectorAll('section[id^="tab-"]')).map((node) => node.id),
    keyButtons: ['openTodayOverviewBtn', 'openWeekOverviewBtn', 'openFreeSlotsOverviewBtn', 'openHistoryLog', 'timeSettingsList']
      .map((id) => ({ id, exists: !!document.getElementById(id) }))
  }));
  const functionInfo = await page.evaluate(() => ({
    openTodayOverviewV64: typeof window.openTodayOverviewV64,
    openWeekOverviewV64: typeof window.openWeekOverviewV64,
    openHistoryLogV64: typeof window.openHistoryLogV64,
    openOpeningHoursDay: typeof window.openOpeningHoursDay,
    openFreeSlotsOverviewV64: typeof window.openFreeSlotsOverviewV64,
    openAppointmentEditorV64: typeof window.openAppointmentEditorV64,
    openOverviewLayerV64: typeof window.openOverviewLayerV64
  }));

  results.push(await clickAndCheck(page, '#openTodayOverviewBtn', '#overviewDetailModal.active, #overviewDetailModal[aria-hidden="false"]', 'today-overview'));
  if (await page.locator('#overviewDetailClose').count()) {
    await page.locator('#overviewDetailClose').first().click({ force: true }).catch(() => {});
    await page.waitForTimeout(200);
  }

  results.push(await clickAndCheck(page, '#openWeekOverviewBtn', '#overviewDetailModal.active, #overviewDetailModal[aria-hidden="false"]', 'week-overview'));
  if (await page.locator('#overviewDetailClose').count()) {
    await page.locator('#overviewDetailClose').first().click({ force: true }).catch(() => {});
    await page.waitForTimeout(200);
  }

  await page.evaluate(() => {
    if (typeof window.openTab === 'function') window.openTab('settings');
    else if (typeof openTab === 'function') openTab('settings');
  }).catch(() => {});
  await page.waitForTimeout(500);

  const settingsInfo = await page.evaluate(() => {
    const tab = document.getElementById('tab-settings');
    return {
      tabExists: !!tab,
      tabVisible: !!tab && getComputedStyle(tab).display !== 'none',
      historyButton: !!document.getElementById('openHistoryLog'),
      openingButtons: document.querySelectorAll('[data-opening-day]').length,
      settingsText: tab ? tab.innerText.slice(0, 600) : ''
    };
  });

  const historyBtnCount = await page.locator('#openHistoryLog').count();
  if (historyBtnCount) {
    results.push(await clickAndCheck(page, '#openHistoryLog', '#overviewDetailModal.active, #overviewDetailModal[aria-hidden="false"]', 'history'));
    if (await page.locator('#overviewDetailClose').count()) {
      await page.locator('#overviewDetailClose').first().click({ force: true }).catch(() => {});
      await page.waitForTimeout(200);
    }
  } else {
    results.push({ name: 'history', ok: false, reason: 'button-missing' });
  }

  const dayEditCount = await page.locator('#openOpeningHoursOverview').count();
  if (dayEditCount) {
    results.push(await clickAndCheck(page, '#openOpeningHoursOverview', '#overviewDetailModal.active, #overviewDetailModal[aria-hidden="false"]', 'opening-hours'));
    if (await page.locator('#overviewDetailClose').count()) {
      await page.locator('#overviewDetailClose').first().click({ force: true }).catch(() => {});
      await page.waitForTimeout(200);
    }
  } else {
    results.push({ name: 'opening-hours', ok: false, reason: 'button-missing' });
  }

  await page.evaluate(() => {
    if (typeof window.openTab === 'function') window.openTab('overview');
    else if (typeof openTab === 'function') openTab('overview');
  }).catch(() => {});
  await page.waitForTimeout(400);

  const overviewInfo = await page.evaluate(() => {
    const tab = document.getElementById('tab-overview');
    return {
      tabExists: !!tab,
      tabVisible: !!tab && getComputedStyle(tab).display !== 'none',
      freeSlotsOpenBtn: !!document.getElementById('openFreeSlotsOverviewBtn'),
      freeSlotButtons: document.querySelectorAll('.lia-free-slot-btn, .free-slot-booking-card, [data-slot-date][data-slot-time]').length,
      overviewText: tab ? tab.innerText.slice(0, 600) : ''
    };
  });

  results.push(await clickAndCheck(page, '#openFreeSlotsOverviewBtn', '#overviewDetailModal.active, #overviewDetailModal[aria-hidden="false"]', 'free-slots-open'));

  let freeSlotResult = { name: 'free-slot-time', ok: false, reason: 'button-missing' };
  if (await page.locator('.lia-free-slot-btn, .free-slot-booking-card, [data-slot-date][data-slot-time]').count()) {
    const slotButton = page.locator('.lia-free-slot-btn, .free-slot-booking-card, [data-slot-date][data-slot-time]').first();
    await slotButton.click({ force: true }).catch((error) => {
      freeSlotResult = { name: 'free-slot-time', ok: false, reason: `click-error:${error.message}` };
    });
    await page.waitForTimeout(500);
    const modalVisible = await page.locator('#overviewDetailModal.active, #overviewDetailModal[aria-hidden="false"]').count();
    const title = await textOrNull(page, '#overviewDetailTitle');
    freeSlotResult = {
      name: 'free-slot-time',
      ok: !!modalVisible && /Termin vergeben|Termin bearbeiten/i.test(title || ''),
      reason: title || 'not-opened'
    };
  }
  results.push(freeSlotResult);

  const directFunctionResults = await page.evaluate(async () => {
    const out = {};
    try {
      out.historyCall = typeof window.openHistoryLogV64 === 'function' ? window.openHistoryLogV64() : 'missing';
      out.historyModal = !!document.querySelector('#overviewDetailModal.active, #overviewDetailModal[aria-hidden="false"]');
      document.getElementById('overviewDetailClose')?.click();
    } catch (error) {
      out.historyError = String(error?.message || error);
    }
    try {
      out.openingCall = typeof window.openOpeningHoursDay === 'function' ? window.openOpeningHoursDay('Mo') : 'missing';
      out.openingModal = !!document.querySelector('#overviewDetailModal.active, #overviewDetailModal[aria-hidden="false"]');
      document.getElementById('overviewDetailClose')?.click();
    } catch (error) {
      out.openingError = String(error?.message || error);
    }
    try {
      out.freeCall = typeof window.openFreeSlotsOverviewV64 === 'function' ? window.openFreeSlotsOverviewV64() : 'missing';
      out.freeModal = !!document.querySelector('#overviewDetailModal.active, #overviewDetailModal[aria-hidden="false"]');
      const slot = document.querySelector('.lia-free-slot-btn, .free-slot-booking-card, [data-slot-date][data-slot-time]');
      out.freeSlotExists = !!slot;
      if (slot) slot.click();
      out.afterSlotTitle = document.getElementById('overviewDetailTitle')?.textContent || '';
    } catch (error) {
      out.freeError = String(error?.message || error);
    }
    return out;
  });

  console.log(JSON.stringify({
    login: 'ok',
    results,
    initialDomInfo,
    functionInfo,
    directFunctionResults,
    settingsInfo,
    overviewInfo,
    consoleMessages,
    pageErrors
  }, null, 2));

  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
