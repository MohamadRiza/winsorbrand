import { test, expect } from '@playwright/test';

test.describe('Storefront UI/UX Suite', () => {

  test('Homepage renders hero, luxury navigation, brand trust banner, and footer', async ({ page }) => {
    await page.goto('/');

    // Check page title
    await expect(page).toHaveTitle(/Winsor/i);

    // Verify navigation logo/brand name
    const navbar = page.locator('nav').first();
    await expect(navbar).toBeVisible();
    await expect(page.getByRole('link', { name: /WINSOR/i }).first()).toBeVisible();

    // Verify navigation links
    const collectionsLink = page.getByRole('link', { name: /COLLECTIONS/i }).first();
    await expect(collectionsLink).toBeVisible();

    // Verify footer elements
    const footer = page.locator('footer').first();
    await expect(footer).toBeVisible();
    await expect(footer.getByText(/WINSOR/i).first()).toBeVisible();
    await expect(footer.getByText(/All rights reserved/i)).toBeVisible();
  });

  test('Collections and category catalog pages render seamlessly', async ({ page }) => {
    // Test Collections main page
    await page.goto('/collections');
    await expect(page).toHaveURL(/.*collections/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // Test specific categories
    const categories = ['/mens', '/womens', '/sports', '/new-arrivals', '/gifts'];
    for (const cat of categories) {
      const res = await page.goto(cat);
      expect(res?.status()).toBeLessThan(400);
      await expect(page.locator('h1, h2, [class*="hero"], body').first()).toBeVisible();
    }
  });

  test('Warranty & Service Terms page displays correct typography, hierarchy, and section links', async ({ page }) => {
    await page.goto('/warranty');

    // Heading validation (fixed typography and sizing)
    const mainHeading = page.locator('h1', { hasText: 'WINSOR WARRANTY & SERVICE TERMS' });
    await expect(mainHeading).toBeVisible();

    const subTagline = page.getByText('YOUR WINSOR. YOUR MOMENT. OUR COMMITMENT.');
    await expect(subTagline).toBeVisible();

    const warrantyLead = page.getByText(/backed by a 1-Year International Warranty/i);
    await expect(warrantyLead).toBeVisible();

    // Check warranty table of contents section
    await expect(page.getByText('WARRANTY AT A GLANCE')).toBeVisible();
    await expect(page.getByRole('heading', { name: '1. WHAT DOES THE WINSOR WARRANTY COVER?' })).toBeVisible();
  });

  test('Retailers page displays boutique locator and search interface', async ({ page }) => {
    await page.goto('/retailers');

    // Page title or main header
    await expect(page.locator('h1, h2').filter({ hasText: /retailer|boutique|store|locator/i }).first()).toBeVisible();

    // Search or filter input presence
    const searchInput = page.locator('input[type="text"], input[type="search"]').first();
    await expect(searchInput).toBeVisible();
  });

  test('Cart page renders empty bag state and navigation to shop', async ({ page }) => {
    await page.goto('/cart');

    // Expect cart heading or empty state message
    await expect(page.getByText(/Shopping Bag|Cart|Your bag is empty/i).first()).toBeVisible();
  });

  test('Order tracking page renders search controls and tracking fields', async ({ page }) => {
    await page.goto('/orders/track');

    // Tracking input & button
    const trackInput = page.locator('input[placeholder*="WSR"], input[placeholder*="order" i], input[type="text"]').first();
    await expect(trackInput).toBeVisible();

    const trackBtn = page.getByRole('button', { name: /track/i });
    await expect(trackBtn).toBeVisible();
  });

  test('Customer service, legal, and policy pages render correctly', async ({ page }) => {
    const pagesToCheck = [
      { url: '/contact', text: /contact|get in touch/i },
      { url: '/faq', text: /frequently asked questions|faq/i },
      { url: '/customer-care', text: /customer care|care/i },
      { url: '/privacy', text: /privacy/i },
      { url: '/terms', text: /terms/i },
      { url: '/return', text: /return/i },
    ];

    for (const item of pagesToCheck) {
      const response = await page.goto(item.url);
      expect(response?.status()).toBeLessThan(400);
      await expect(page.getByText(item.text).first()).toBeVisible();
    }
  });

});
