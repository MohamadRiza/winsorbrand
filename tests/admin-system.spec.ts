import { test, expect } from '@playwright/test';
import { setupAdminSession } from './helpers/auth';

test.describe('Admin Control & System Management Suite', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ context }) => {
    await setupAdminSession(context);
  });

  test('Admin dashboard renders KPI cards, metrics, and sidebar navigation', async ({ page }) => {
    await page.goto('/admin/dashboard');

    // Verify page loads without redirecting to login
    await expect(page).toHaveURL(/.*admin\/dashboard/);

    // Verify presence of main dashboard heading or summary
    await expect(page.getByText(/Dashboard|Executive Overview|Live Operations/i).first()).toBeVisible({ timeout: 30000 });

    // Verify presence of stat cards
    const statCards = page.locator('.stat-card-box, [class*="stat-card"]');
    await expect(statCards.first()).toBeVisible();

    // Verify Sidebar navigation items
    const sidebar = page.locator('aside, nav, [class*="sidebar"]').first();
    await expect(sidebar).toBeVisible();
    await expect(page.getByRole('link', { name: /products/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /orders/i }).first()).toBeVisible();
  });

  test('Categories page displays occasion list, status badges, and filter tabs', async ({ page }) => {
    await page.goto('/admin/products/categories');

    await expect(page).toHaveURL(/.*admin\/products\/categories/);
    await expect(page.getByText(/Category|Occasions|Categories/i).first()).toBeVisible({ timeout: 30000 });

    // Verify filter buttons/tabs
    await expect(page.getByRole('button', { name: /all/i }).first()).toBeVisible();

    // Check for add category form inputs
    const labelInput = page.locator('input[placeholder*="Eid" i], input[name*="label" i], input[type="text"]').first();
    await expect(labelInput).toBeVisible();
  });

  test('Coupons page enforces Admin Password requirement for discounts > 10%', async ({ page }) => {
    await page.goto('/admin/coupons');

    await expect(page).toHaveURL(/.*admin\/coupons/);
    await expect(page.getByText(/PROMOTIONAL COUPONS|DISCOUNTS/i).first()).toBeVisible({ timeout: 30000 });

    // Locate discount percentage number input
    const discountInput = page.locator('input[type="number"]').first();
    await expect(discountInput).toBeVisible();

    // When set to 10%, high-discount admin authorization warning should not appear
    await discountInput.fill('10');
    await expect(page.getByText('Admin Authorization Required')).not.toBeVisible();

    // When set to 25%, high-discount admin authorization warning & password must appear
    await discountInput.fill('25');
    await expect(page.getByText('Admin Authorization Required')).toBeVisible();
    await expect(page.getByText(/Discount exceeds the standard 10% limit/i)).toBeVisible();

    // Verify admin password input field is rendered
    const adminPasswordInput = page.locator('input[type="password"]');
    await expect(adminPasswordInput).toBeVisible();
  });

  test('Staff management modal contains granular permissions including fake and customer reviews', async ({ page }) => {
    await page.goto('/admin/staff');

    await expect(page).toHaveURL(/.*admin\/staff/);
    await expect(page.getByText(/Staff Management|Staff Accounts/i).first()).toBeVisible();

    // Click button to open new staff modal
    const addStaffBtn = page.getByRole('button', { name: /add staff|create staff|new staff/i }).first();
    if (await addStaffBtn.isVisible()) {
      await addStaffBtn.click();

      // Check that the modal opened
      await expect(page.getByText(/Staff Role & Access Privileges|Create Staff/i).first()).toBeVisible();

      // Check specific permission toggles requested by user
      await expect(page.getByText(/Create & Manage Fake \/ Mock Reviews/i)).toBeVisible();
      await expect(page.getByText(/Approve & Reject Customer Reviews/i)).toBeVisible();
      await expect(page.getByText(/Manage Coupons/i)).toBeVisible();
    }
  });

  test('Admin orders, messages, and inventory pages render cleanly', async ({ page }) => {
    const adminPages = [
      { url: '/admin/orders', title: /order/i },
      { url: '/admin/messages', title: /message|inquir/i },
      { url: '/admin/inventory', title: /inventory|stock/i },
    ];

    for (const item of adminPages) {
      const res = await page.goto(item.url);
      expect(res?.status()).toBeLessThan(400);
      await expect(page.getByText(item.title).first()).toBeVisible();
    }
  });

});
