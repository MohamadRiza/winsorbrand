import { test, expect } from '@playwright/test';
import { setupAdminSession } from './helpers/auth';

test.describe.configure({ mode: 'serial' });

test.describe('Admin Approval Workflow Suite', () => {
  test.beforeEach(async ({ context, page }) => {
    await setupAdminSession(context);
    await page.addInitScript(() => {
      sessionStorage.setItem('winsor_admin_inventory_dismissed', 'true');
      sessionStorage.setItem('winsor_admin_occasions_dismissed', 'true');
    });
  });

  test('Admin dashboard displays Pending Approvals KPI stat card linking to /admin/approvals', async ({ page }) => {
    await page.goto('/admin/dashboard', { waitUntil: 'domcontentloaded', timeout: 30000 });
    
    // Check that Pending Approvals card exists
    const approvalCard = page.locator('text=Pending Approvals');
    await expect(approvalCard).toBeVisible({ timeout: 15000 });

    // Verify it links to /admin/approvals
    const cardLink = page.locator('a[href="/admin/approvals"]');
    await expect(cardLink.first()).toBeVisible({ timeout: 10000 });
  });

  test('Admin approvals page renders header, tabs, and queue controls', async ({ page }) => {
    await page.goto('/admin/approvals', { waitUntil: 'domcontentloaded', timeout: 30000 });

    // Verify page heading
    const heading = page.locator('h1:has-text("Staff Submission Approvals")');
    await expect(heading).toBeVisible({ timeout: 15000 });

    // Verify tabs: Pending, Approved, Rejected
    await expect(page.locator('button:has-text("Pending")')).toBeVisible();
    await expect(page.locator('button:has-text("Approved")')).toBeVisible();
    await expect(page.locator('button:has-text("Rejected")')).toBeVisible();

    // Verify back to dashboard link
    const backBtn = page.getByRole('link', { name: '← Dashboard' });
    await expect(backBtn).toBeVisible();
  });

  test('Staff registration modal renders Require Admin Approval toggle with security warning', async ({ page }) => {
    await page.goto('/admin/staff', { waitUntil: 'domcontentloaded', timeout: 30000 });

    // Open Register Staff modal
    const registerBtn = page.locator('button:has-text("Register Staff Account")');
    await expect(registerBtn).toBeVisible({ timeout: 15000 });
    await registerBtn.click();

    // Verify the "Require Admin Approval" toggle card
    const toggleLabel = page.locator('text=REQUIRE ADMIN APPROVAL');
    await expect(toggleLabel).toBeVisible({ timeout: 10000 });

    // Verify the warning subtext
    const subtext = page.locator('text=When enabled, this staff member\'s content changes will require your approval before going live.');
    await expect(subtext).toBeVisible();

    // Click toggle to enable
    const toggleBtn = page.locator('button[aria-pressed]').first();
    await expect(toggleBtn).toBeVisible();
    await toggleBtn.click();

    // Verify ENABLED badge appears
    await expect(page.locator('span:has-text("ENABLED")').first()).toBeVisible();
    await expect(page.locator('text=All product & review submissions by this staff will be held for your review before going live.')).toBeVisible();
  });

  test('Sidebar navigation displays Approvals menu link with custom icon and badge support', async ({ page }) => {
    await page.goto('/admin/dashboard', { waitUntil: 'domcontentloaded', timeout: 30000 });

    const approvalsNavLink = page.locator('nav a[href="/admin/approvals"]');
    await expect(approvalsNavLink).toBeVisible({ timeout: 15000 });
    await expect(approvalsNavLink).toContainText('Approvals');
  });
});