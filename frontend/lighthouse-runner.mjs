import { launch } from 'puppeteer';
import fs from 'fs';
import { mkdirSync, existsSync } from 'fs';
import lighthouse from 'lighthouse';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import spawn from 'cross-spawn';

// Setup __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Pages to test
const pages = [
  'http://localhost:3000/send-reset-link',
  'http://localhost:3000/signup',
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

  const reportPath = `${reportDir}/report-${index + 1}-${new URL(url).pathname.replace(/\//g, '') || 'home'}.html`;
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

  await new Promise(resolve => setTimeout(resolve, 10000)); // Wait for server to boot

  const browser = await launch({ headless: false, args: ['--remote-debugging-port=9222'] });
  const page = await browser.newPage();

  // Log in once before all audits if needed
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  await page.type('input[placeholder=Username]', 'santhosh.rv173@gmail.com');
  await page.type('input[placeholder=Password]', 'S@ndyyy@741821');
  await Promise.all([
    page.click('button[type=submit]'),
    page.waitForNavigation({ waitUntil: 'networkidle0' })
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
