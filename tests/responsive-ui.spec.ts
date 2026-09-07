import { test, expect } from '@playwright/test';

test.describe('Responsive Layout & Mobile UI/UX Suite', () => {

  test('Homepage displays mobile navigation and has zero horizontal scroll overflow', async ({ page }) => {
    // Standard mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Wait for content to stabilize
    await page.waitForLoadState('domcontentloaded');

    // Verify no unwanted horizontal scroll overflow
    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth + 1; // 1px margin of error for subpixel rendering
    });
    expect(hasHorizontalOverflow).toBe(false);

    // Mobile menu button / hamburger should be present
    const mobileMenuBtn = page.locator('button.wn-mob-only');
    await expect(mobileMenuBtn).toBeVisible();
    await mobileMenuBtn.click();
    await expect(page.locator('body.wn-mobile-menu-open')).toBeVisible();
  });

  test('Warranty page is fully responsive on tablet and mobile viewports with no overflow', async ({ page }) => {
    // Tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/warranty');

    const tabletOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth + 1;
    });
    expect(tabletOverflow).toBe(false);

    // Mobile viewport
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/warranty');

    const mobileOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth + 1;
    });
    expect(mobileOverflow).toBe(false);

    // Sizing and headers should fit nicely
    const heading = page.locator('h1', { hasText: 'WINSOR WARRANTY & SERVICE TERMS' });
    await expect(heading).toBeVisible();
  });

  test('Cart and Retailers pages scale properly on mobile screens', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    // Cart page
    await page.goto('/cart');
    const cartOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth + 1;
    });
    expect(cartOverflow).toBe(false);

    // Retailers page
    await page.goto('/retailers');
    const retailersOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth + 1;
    });
    expect(retailersOverflow).toBe(false);
  });

});
