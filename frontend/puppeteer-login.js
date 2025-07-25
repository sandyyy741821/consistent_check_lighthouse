// puppeteer-login.js
export default async (page, context) => {
  await page.goto('http://localhost:3000/signup', { waitUntil: 'networkidle0' });

  await page.type('input[placeholder=Username]', 'santhosh.rv173@gmail.com');
  await page.type('input[placeholder=Password]', 'S@ndyyy@741821');

  await Promise.all([
    page.click('button[type=submit]'),
    page.waitForNavigation({ waitUntil: 'networkidle0' }),
  ]);

  // This saves cookies for subsequent audits
  context.lhci.setCookies(await page.cookies());
};
