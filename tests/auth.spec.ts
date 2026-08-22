import { test, expect } from '@playwright/test';

test.describe('Authentication flow', () => {
  test('User can log in and session is established', async ({ page, context }) => {
    // 1. Navigate to the login page
    await page.goto('/login');

    // 3. Fill in the login credentials
    // Note: Replace these with actual test user credentials in your environment
    await page.fill('input[name="email"]', 'delivered@example.com'); 
    await page.fill('input[name="password"]', 'pass@123');

    // 4. Submit the login form
    await page.click('button[type="submit"]');

    // 5. Verify the user is redirected away from the login page upon success
    await page.waitForURL('**/', { timeout: 10000 });
    
    // 6. Check that the HttpOnly session cookie was set by the backend
    const cookies = await context.cookies();
    const sessionCookie = cookies.find(c => c.name === 'access_token' || c.name === 'sessionid'); // Adjust cookie name to your Django configuration
    
    // In Django Rest Framework SimpleJWT (cookie auth), there is usually an access_token or similar cookie.
    expect(sessionCookie).toBeDefined();
    expect(sessionCookie?.httpOnly).toBeTruthy();

    // 7. Verify UI state reflects an authenticated user
    // e.g. checking that the URL is not the login page anymore and there is a "Logout" or "Workspaces" indicator
    // This expects the API to have responded successfully to /api/v1/users/me/
    
    // As an example, if they get redirected to a workspace or onboarding:
    // await expect(page.locator('text=Workspaces')).toBeVisible(); 
  });
});
