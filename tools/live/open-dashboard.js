const path = require('path');
const { chromium } = require('playwright-core');

const edgePath = process.env.LIA_EDGE_PATH || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const targetUrl = process.env.LIA_BASE_URL || 'http://127.0.0.1:4173/dashboard.html';

async function main() {
  const browser = await chromium.launch({
    headless: false,
    executablePath: edgePath,
    args: ['--new-window']
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 960 }
  });

  const page = await context.newPage();
  page.on('console', (msg) => {
    console.log(`[browser:${msg.type()}] ${msg.text()}`);
  });
  page.on('pageerror', (err) => {
    console.log(`[pageerror] ${err.message}`);
  });

  await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });
  console.log(`Opened ${targetUrl}`);
  console.log('Leave this window open for manual checks. Close it with Ctrl+C in the terminal when you are done.');

  process.stdin.resume();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
