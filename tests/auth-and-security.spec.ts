import { test, expect } from '@playwright/test';

test.describe('Authentication, Security & Chrome Isolation Suite', () => {

  test('Staff login page isolates UI by hiding storefront navbar and footer', async ({ page }) => {
    await page.goto('/staff/login');

    // Storefront navbar and footer must be hidden
    await expect(page.locator('nav')).not.toBeVisible();
    await expect(page.locator('footer')).not.toBeVisible();

    // Staff portal heading and login form elements
    await expect(page.getByText(/STAFF PORTAL|Staff Access|Staff Login/i).first()).toBeVisible();

    // Username / Staff ID and Password input fields
    const usernameInput = page.locator('input[type="text"], input[name*="username" i], input[placeholder*="user" i]').first();
    await expect(usernameInput).toBeVisible();

    const passwordInput = page.locator('input[type="password"]').first();
    await expect(passwordInput).toBeVisible();

    // Login submit button
    const submitBtn = page.getByRole('button', { name: /login|sign in|access/i }).first();
    await expect(submitBtn).toBeVisible();
  });

  test('Admin login page renders 3D card layout and login fields without public chrome', async ({ page }) => {
    await page.goto('/admin/login');

    // Storefront chrome should be hidden
    await expect(page.locator('nav')).not.toBeVisible();
    await expect(page.locator('footer')).not.toBeVisible();

    // Admin login card
    await expect(page.getByText(/Admin Portal|Sign in to your account/i).first()).toBeVisible();

    // Form fields
    const usernameInput = page.locator('input[type="text"]').first();
    await expect(usernameInput).toBeVisible();

    const passwordInput = page.locator('input[type="password"]').first();
    await expect(passwordInput).toBeVisible();

    const submitBtn = page.getByRole('button', { name: /sign in|login|verify/i }).first();
    await expect(submitBtn).toBeVisible();
  });

  test('Unauthenticated user is guarded and redirected from admin routes', async ({ page }) => {
    // Attempt visiting admin dashboard directly
    await page.goto('/admin/dashboard');
    await page.waitForURL(/.*admin\/login.*/, { timeout: 10000 });
    expect(page.url()).toContain('/admin/login');

    // Attempt visiting admin orders directly
    await page.goto('/admin/orders');
    await page.waitForURL(/.*admin\/login.*/, { timeout: 10000 });
    expect(page.url()).toContain('/admin/login');
  });

});
