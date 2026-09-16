import { chromium } from 'playwright';

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

(async () => {
  console.log('Launching Chrome in interactive mode for the user...');

  const browser = await chromium.launch({
    headless: false,
    channel: 'chrome',
    args: ['--start-maximized'],
    slowMo: 300,
  });

  const context = await browser.newContext({
    viewport: null, // allows browser to size naturally to window
  });

  const page = await context.newPage();

  async function updateStatus(message) {
    console.log(`>>> ${message}`);
    await page.evaluate((msg) => {
      let banner = document.getElementById('antigravity-live-banner');
      if (!banner) {
        banner = document.createElement('div');
        banner.id = 'antigravity-live-banner';
        banner.style.cssText = `
          position: fixed;
          top: 12px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(10, 8, 5, 0.92);
          color: #dfb15b;
          border: 1.5px solid #8B6914;
          padding: 10px 24px;
          border-radius: 9999px;
          font-family: 'Jost', -apple-system, BlinkMacSystemFont, sans-serif;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.08em;
          z-index: 99999999;
          box-shadow: 0 10px 30px rgba(0,0,0,0.5);
          pointer-events: none;
          display: flex;
          align-items: center;
          gap: 10px;
          transition: all 0.3s ease;
        `;
        document.body.appendChild(banner);
      }
      banner.innerHTML = `<span style="width:8px;height:8px;border-radius:50%;background:#10b981;box-shadow:0 0 8px #10b981;display:inline-block;"></span> <span>${msg}</span>`;
    }, message).catch(() => {});
  }

  try {
    // ── STEP 1: OPEN HOMEPAGE ──
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
    await updateStatus('1/7: Welcome to Winsor Maison — Exploring Homepage & 3D Assembly');
    await delay(2000);

    // Smooth scroll down through the 3D assembly and hero
    for (let i = 0; i < 4; i++) {
      await page.mouse.wheel(0, 450);
      await delay(900);
    }

    // Scroll through collections section
    await updateStatus('Exploring Featured Timepiece Collections');
    for (let i = 0; i < 5; i++) {
      await page.mouse.wheel(0, 550);
      await delay(800);
    }

    // ── STEP 2: TEST NAVBAR SEARCH ──
    await updateStatus('2/7: Testing Live Search in Navigation Bar');
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
    await delay(1200);

    const searchBtn = await page.$('button[aria-label*="Search"]');
    if (searchBtn) {
      await searchBtn.click();
      await delay(600);
      const searchInput = await page.$('input[placeholder*="Search"]');
      if (searchInput) {
        await searchInput.type('Royal', { delay: 180 });
        await delay(2000);
        await searchInput.fill('');
        await page.keyboard.press('Escape');
      }
    }
    await delay(1000);

    // ── STEP 3: NAVIGATE TO COLLECTIONS ──
    await updateStatus('3/7: Navigating to Full Collections Catalog');
    await page.goto('http://localhost:3000/collections', { waitUntil: 'domcontentloaded' });
    await delay(1500);

    // Scroll down and test sorting dropdown
    await updateStatus('Testing Filter & Price Sort Toolbar');
    await page.mouse.wheel(0, 400);
    await delay(800);

    const sortSelect = await page.$('select[aria-label="Sort by price"]');
    if (sortSelect) {
      await sortSelect.selectOption('low-to-high');
      await delay(1500);
      await sortSelect.selectOption('high-to-low');
      await delay(1500);
      await sortSelect.selectOption('none');
    }
    await delay(1000);

    // Scroll through watches
    for (let i = 0; i < 3; i++) {
      await page.mouse.wheel(0, 500);
      await delay(700);
    }

    // ── STEP 4: VIEW A TIMEPIECE PRODUCT PAGE ──
    await updateStatus('4/7: Opening Product Detail Page & Verifying 14-Day Return Policy');
    const firstProductLink = await page.$('a[href^="/collections/"]');
    if (firstProductLink) {
      await firstProductLink.click();
      await page.waitForLoadState('domcontentloaded');
      await delay(2000);

      // Scroll down to view trust badges and accordion
      await page.mouse.wheel(0, 500);
      await delay(1200);
      await page.mouse.wheel(0, 400);
      await delay(1200);
    }

    // ── STEP 5: OUR STORY ──
    await updateStatus('5/7: Exploring Our Story — Heritage, Timeline & Verified Distinctions');
    await page.goto('http://localhost:3000/our-story', { waitUntil: 'domcontentloaded' });
    await delay(1800);

    for (let i = 0; i < 5; i++) {
      await page.mouse.wheel(0, 600);
      await delay(900);
    }

    // ── STEP 6: RETAILERS & BOUTIQUES ──
    await updateStatus('6/7: Checking Boutique Store Locator & Interactive Map');
    await page.goto('http://localhost:3000/retailers', { waitUntil: 'domcontentloaded' });
    await delay(2000);

    await page.mouse.wheel(0, 500);
    await delay(1500);

    // ── STEP 7: TEST AI CONCIERGE WIDGET ──
    await updateStatus('7/7: Opening Winsi AI Concierge Live Chat');
    const conciergeTrigger = await page.$('.ai-widget-trigger');
    if (conciergeTrigger) {
      await conciergeTrigger.click();
      await delay(1000);

      const aiItem = await page.$('.wn-concierge-item.ai-item');
      if (aiItem) {
        await aiItem.click();
        await delay(1500);

        // Type a friendly message to Winsi
        const chatInput = await page.$('.ai-chat-input');
        if (chatInput) {
          await chatInput.type('What is your warranty and return policy?', { delay: 60 });
          await delay(800);
          await page.keyboard.press('Enter');
          await delay(3500);
        }
      }
    }

    await updateStatus('Website Tour Completed! The browser is now yours to explore freely.');
    console.log('Tour completed successfully. Keeping browser open for user.');

    // Keep the browser running so the user can use mouse and keyboard freely
    await new Promise(() => {});

  } catch (err) {
    console.error('Interactive tour notice:', err.message);
  }
})();
