import puppeteer from 'puppeteer';
import fs from 'fs';
import lighthouse from 'lighthouse';
import { launch } from 'chrome-launcher';
import spawn from 'cross-spawn';
import http from 'http';
import path from 'path';

const LOGIN_URL = 'http://localhost:3000';
const WELCOME_URL = 'http://localhost:3000/welcome';
const USERNAME = 'santhosh.rv173@gmail.com';
const PASSWORD = 'S@ndyyy@741821';

function waitForServerReady(url, timeout = 30000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const check = () => {
      http.get(url, res => {
        if (res.statusCode === 200) resolve();
        else retry();
      }).on('error', retry);
    };
    const retry = () => {
      if (Date.now() - start > timeout) {
        reject(new Error('Timeout waiting for frontend server to start.'));
      } else {
        setTimeout(check, 1000);
      }
    };
    check();
  });
}

const startFrontend = () => {
  console.log('🚀 Starting frontend server...');
  const proc = spawn('npm', ['run', 'dev'], {
    shell: true,
    stdio: 'inherit'
  });

  proc.on('error', (err) => {
    console.error('❌ Failed to start frontend server:', err.message);
  });

  return proc;
};

const waitForWelcomePage = async (page) => {
  await page.waitForFunction(
    () => window.location.href.includes('/welcome'),
    { timeout: 15000 }
  );
};

const runLighthouseAudit = async (url, cookies, namePrefix) => {
  const chrome = await launch({ chromeFlags: ['--headless'] });

  const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join('; ');

  const result = await lighthouse(url, {
    port: chrome.port,
    output: ['json', 'html'],
    logLevel: 'info',
    extraHeaders: { cookie: cookieHeader }
  });

  const dir = './lighthouse';
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }

  fs.writeFileSync(path.join(dir, `${namePrefix}-report.json`), result.report[0]);
  fs.writeFileSync(path.join(dir, `${namePrefix}-report.html`), result.report[1]);
  console.log(`📄 Lighthouse report saved for ${url}`);

  await chrome.kill();
};

(async () => {
  const frontend = startFrontend();

  process.on('exit', () => {
    if (frontend && !frontend.killed) frontend.kill('SIGTERM');
  });

  try {
    console.log('⏳ Waiting for frontend to be ready...');
    await waitForServerReady(LOGIN_URL);
    console.log('✅ Frontend is ready!');

    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    console.log('🌐 Logging into the app...');
    try {
      await page.goto(LOGIN_URL, { waitUntil: 'networkidle2', timeout: 20000 });
    } catch {
      console.warn('⚠️ First navigation failed, retrying...');
      await new Promise(res => setTimeout(res, 3000));
      await page.goto(LOGIN_URL, { waitUntil: 'domcontentloaded', timeout: 10000 });
    }

    await page.waitForSelector('input[placeholder="Username"]', { timeout: 10000 });
    await page.type('input[placeholder="Username"]', USERNAME);
    await page.type('input[placeholder="Password"]', PASSWORD);
    await page.click('button[type="submit"]');

    await waitForWelcomePage(page);
    console.log('✅ Logged in successfully and navigated to /welcome');

    const cookies = await page.cookies();
    await browser.close();

    // Run Lighthouse audits for both pages
    await runLighthouseAudit(LOGIN_URL, cookies, 'login');
    await runLighthouseAudit(WELCOME_URL, cookies, 'welcome');

  } catch (err) {
    console.error('❌ Error during Lighthouse run:', err);
  } finally {
    if (frontend && !frontend.killed) frontend.kill('SIGTERM');
  }
})();
