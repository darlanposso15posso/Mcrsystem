const { chromium } = require('playwright');
(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.goto('http://localhost:5173', { waitUntil: 'load' });
    const content = await page.content();
    console.log(content.substring(0, 500));
    const errors = await page.evaluate(() => {
        return document.body.innerHTML.includes('vite-error-overlay') ? "HAS VITE ERROR" : "NO VITE ERROR";
    });
    console.log(errors);
    await browser.close();
})();
