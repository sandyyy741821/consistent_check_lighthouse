//lighthouse-runner.mjs
import { launch } from 'puppeteer';
import fs from 'fs';
import { mkdirSync, existsSync } from 'fs';
import lighthouse from 'lighthouse';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import spawn from 'cross-spawn';
import fetch from 'node-fetch'; // 👈 Ensure installed: npm i node-fetch

// Setup __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Pages to test
const pages = [
  'http://localhost:3000',
  'http://localhost:3000/welcome',
  'http://localhost:3000/test'
];

// Report folder
const reportDir = `${__dirname}/lighthouse`;
if (!existsSync(reportDir)) mkdirSync(reportDir);

const runLighthouseAudit = async (url, browser, index, cookies) => {
  const { lhr, report } = await lighthouse(url, {
    port: new URL(browser.wsEndpoint()).port,
    output: 'html',
    logLevel: 'info',
    extraHeaders: {
      Cookie: cookies.map(c => `${c.name}=${c.value}`).join('; ')
    }
  });

  const pathname = new URL(url).pathname.replace(/\//g, '') || 'home';
  const reportPath = `${reportDir}/report-${index + 1}-${pathname}.html`;
  fs.writeFileSync(reportPath, report);
  console.log(`✅ Lighthouse report saved: ${reportPath}`);
};

const run = async () => {
  console.log('🚀 Starting frontend server...');

  const serverProcess = spawn('npm', ['run', 'dev'], {
    cwd: `${__dirname}`,
    shell: true,
    stdio: 'inherit'
  });

  // Wait for the frontend to be ready
  let isReady = false;
  for (let i = 0; i < 10; i++) {
    try {
      const res = await fetch('http://localhost:3000');
      if (res.ok) {
        isReady = true;
        break;
      }
    } catch (err) {
      // Wait before retry
    }
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  if (!isReady) {
    console.error('❌ Server failed to start in time.');
    serverProcess.kill();
    process.exit(1);
  }

  const browser = await launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--remote-debugging-port=9222'
    ]
  });

  const page = await browser.newPage();

  // Login before audits
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0', timeout: 20000 });
  await page.type('input[placeholder=Username]', 'santhosh.rv173@gmail.com');
  await page.type('input[placeholder=Password]', 'S@ndyyy@741821');
  await Promise.all([
    page.click('button[type=submit]'),
    page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 20000 })
  ]);

  const cookies = await browser.defaultBrowserContext().cookies();

  for (let i = 0; i < pages.length; i++) {
    await runLighthouseAudit(pages[i], browser, i, cookies);
  }

  await browser.close();
  serverProcess.kill();
  console.log('🏁 Done.');
};

run();
