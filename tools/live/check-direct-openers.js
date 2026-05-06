const { chromium } = require('playwright-core');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const targetUrl = 'http://127.0.0.1:4173/dashboard.html';

async function main() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: edgePath
  });

  const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
  const pageErrors = [];
  page.on('pageerror', (err) => pageErrors.push(err.message));

  await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });
  await page.fill('#loginEmail', 'julia@lashes-by-lia.de');
  await page.fill('#loginPassword', 'Julia2026!');
  await page.click('#loginForm button[type="submit"]');
  await page.waitForTimeout(2200);

  const info = await page.evaluate(() => {
    const result = {
      functions: {
        today: typeof window.openTodayOverviewV64,
        week: typeof window.openWeekOverviewV64,
        history: typeof window.openHistoryLogV64,
        opening: typeof window.openOpeningHoursDay,
        freeSlots: typeof window.openFreeSlotsOverviewV64,
        appointment: typeof window.openAppointmentEditorV64
      },
      elements: {
        todayBtn: !!document.getElementById('openTodayOverviewBtn'),
        weekBtn: !!document.getElementById('openWeekOverviewBtn'),
        freeBtn: !!document.getElementById('openFreeSlotsOverviewBtn'),
        historyBtn: !!document.getElementById('openHistoryLog'),
        settingsTab: !!document.getElementById('tab-settings'),
        overviewTab: !!document.getElementById('tab-overview')
      }
    };

    try {
      result.todayReturn = typeof window.openTodayOverviewV64 === 'function' ? window.openTodayOverviewV64() : 'missing';
      result.todayTitle = document.getElementById('overviewDetailTitle')?.textContent || '';
      document.getElementById('overviewDetailClose')?.click();
    } catch (error) {
      result.todayError = String(error?.message || error);
    }

    try {
      result.weekReturn = typeof window.openWeekOverviewV64 === 'function' ? window.openWeekOverviewV64() : 'missing';
      result.weekTitle = document.getElementById('overviewDetailTitle')?.textContent || '';
      document.getElementById('overviewDetailClose')?.click();
    } catch (error) {
      result.weekError = String(error?.message || error);
    }

    try {
      result.historyReturn = typeof window.openHistoryLogV64 === 'function' ? window.openHistoryLogV64() : 'missing';
      result.historyTitle = document.getElementById('overviewDetailTitle')?.textContent || '';
      document.getElementById('overviewDetailClose')?.click();
    } catch (error) {
      result.historyError = String(error?.message || error);
    }

    try {
      result.openingReturn = typeof window.openOpeningHoursDay === 'function' ? window.openOpeningHoursDay('Mo') : 'missing';
      result.openingTitle = document.getElementById('overviewDetailTitle')?.textContent || '';
      document.getElementById('overviewDetailClose')?.click();
    } catch (error) {
      result.openingError = String(error?.message || error);
    }

    try {
      result.freeReturn = typeof window.openFreeSlotsOverviewV64 === 'function' ? window.openFreeSlotsOverviewV64() : 'missing';
      result.freeTitle = document.getElementById('overviewDetailTitle')?.textContent || '';
      const slot = document.querySelector('.lia-free-slot-btn, .free-slot-booking-card, [data-slot-date][data-slot-time]');
      result.freeSlotExists = !!slot;
      if (slot) slot.click();
      result.afterSlotTitle = document.getElementById('overviewDetailTitle')?.textContent || '';
    } catch (error) {
      result.freeError = String(error?.message || error);
    }

    return result;
  });

  console.log(JSON.stringify({ info, pageErrors }, null, 2));
  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
