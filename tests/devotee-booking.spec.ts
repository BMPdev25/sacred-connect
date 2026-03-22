import { test, expect } from '@playwright/test';
import { setupWebMocks } from './web-mocks';

test.describe('Devotee Booking Flow', () => {
  test.beforeEach(async ({ page }) => {
    await setupWebMocks(page);
    await page.goto('/');
  });

  test('should navigate to home after login', async ({ page }) => {
    // Wait for the app to load
    await page.waitForSelector('text=Login', { timeout: 10000 });

    // Fill in login details
    // Note: Using text selectors for now as testIDs in Expo Web often map to aria-labels or data-testid
    const phoneInput = page.getByPlaceholder(/phone|mobile/i);
    const passwordInput = page.getByPlaceholder(/password/i);
    
    await phoneInput.fill('1234567890');
    await passwordInput.fill('password123');
    
    // Click Login button
    await page.getByRole('button', { name: /login|sign in/i }).click();

    // Assert navigation to home
    await expect(page).toHaveURL(/home/);
    await expect(page.getByText(/dashboard|home|welcome/i)).toBeVisible();
  });

  test('should complete the booking wizard flow', async ({ page }) => {
    // Pre-condition: User is logged in (could use a global setup or reuse state)
    // For now, assume we are on the home screen
    await page.goto('/(devotee)/home');
    
    // Click Explore tab
    await page.getByTestId('tab-explore').click();
    
    // Search for a Puja
    const searchInput = page.getByPlaceholder(/search/i);
    await searchInput.fill('Ganesh Puja');
    
    // Select the first ceremony card
    await page.getByTestId('ceremony-card').first().click();
    
    // Progress through booking wizard
    // Step 1: Select Date/Time
    await page.getByTestId('next-button').click();
    
    // Step 2: Address selection
    await page.getByTestId('next-button').click();
    
    // Final Step: Confirm
    await expect(page.getByTestId('confirm-booking-button')).toBeVisible();
    await expect(page.getByTestId('confirm-booking-button')).toBeEnabled();
  });
});
