import { test, expect } from '@playwright/test';
import { setupWebMocks } from './web-mocks';

test.describe('Priest Availability Flow', () => {
  test.beforeEach(async ({ page }) => {
    await setupWebMocks(page);
    await page.goto('/(auth)/login');
  });

  test('should toggle availability as a priest', async ({ page }) => {
    // Login as priest
    await page.getByPlaceholder(/phone/i).fill('9876543210');
    await page.getByPlaceholder(/password/i).fill('password123');
    await page.getByRole('button', { name: /login/i }).click();

    // Navigate to Availability/ProfileSetup
    // Assuming the flow leads to profile or a specific tab
    await page.goto('/priest/(priestScreens)/ProfileSetup?jumpToStep=5');
    
    await expect(page.getByText(/Availability/i)).toBeVisible();

    // Find a day toggle (e.g., Monday)
    const mondayToggle = page.getByTestId('availability-toggle-monday');
    const isChecked = await mondayToggle.getAttribute('aria-checked');
    
    // Click to toggle
    await mondayToggle.click();
    
    // Assert UI reflects change
    const newChecked = await mondayToggle.getAttribute('aria-checked');
    expect(newChecked).not.toBe(isChecked);
  });
});
