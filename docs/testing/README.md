# Testing Documentation & Strategy

This document provides a comprehensive guide to testing the Sacred Connect frontend application, covering operational instructions, strategic planning, and manual procedures.

## 1. Overview & Setup

The `sacred-connect` frontend uses **Jest** as the test runner and **React Native Testing Library** (RNTL) for component testing.

### Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage

# Run a specific test file
npx jest __tests__/detectIdentifierType.test.ts
```

---

## 2. Testing Strategy

Our strategy is divided into three layers to ensure robustness across all user paths.

### 2.1 Unit Testing
Testing individual functions, hooks, and atomic components in isolation.

| Category | Target | Key Scenarios |
| :--- | :--- | :--- |
| **Shared Components** | Button, InputField, LanguagePicker | Rendering, props handling, event triggering (onPress), loading states. |
| **Service Logic** | authServices, bookingService | Mocking API responses to verify success/error handling and token storage. |
| **Utilities** | dateUtils, detectIdentifierType | Pure function validation (regex, formatting logic, calculations). |

### 2.2 Integration & Screen Testing
Testing interactions between components and navigation flows within screens (located in `app/`).

*   **Authentication**: Login flows (Email/Phone), Signup (Devotee/Priest toggle), and validation.
*   **Devotee Flows**: Global Search results, Priest details viewing, and booking creation.
*   **Priest Flows**: Multi-step Profile Setup persistence, availability management, and dashboard stats.

### 2.3 End-to-End (E2E) Scenarios
Simulated real-user journeys (using Playwright or manual walkthroughs).

*   **The Devotee Journey**: Sign up -> Search for Puja -> Book Priest -> Verify "Pending" status.
*   **The Priest Journey**: Sign up -> Complete Profile -> Go Online -> Accept Request -> Mark Completed.
*   **Edge Cases**: Network failure simulation, token expiry (401 auto-logout), and input limits.

---

## 3. Manual Testing Procedures

Use these steps to verify features that are difficult to automate or require visual validation.

### 3.1 UX Refactoring Features
1.  **Login Simplification**: Verify single input field handles both email and phone auto-detection.
2.  **Skeleton Loaders**: Observe pulsing placeholders in Home and Bookings tabs during API fetches.
3.  **Enhanced Booking Cards**: Check for distance (km) and travel time icons on booking items.
4.  **Progressive Onboarding**: Verify the "Go Online" toggle prompts for profile completion if < 80%.

### 3.2 Profile & Services
1.  **Ceremony Selection**: In Profile Setup Step 2, ensure ceremonies load from backend and allow price settings.
2.  **Verification Documents**: Upload a PDF in the Profile tab and verify the "View" and "Re-upload" buttons appear.

---

## 4. Current Test Coverage & Status

### Automated Tests (`__tests__/`)
- ✅ **Colors.test.ts**: Validates theme constants.
- ✅ **detectIdentifierType.test.ts**: Tests email vs phone detection logic.
- ✅ **SkeletonCard.test.tsx**: Tests pulsed animation and rendering.
- ⏳ **Planned**: LanguagePicker validation, Profile Banner logic, and Auth service mocks.

### Integration Progress
- ✅ Login/Signup validation
- ✅ Progressive onboarding triggers
- ✅ Booking detail views
- ⏳ Distance/Travel time calculation (currently mocked)

---

## 5. Security & Permission Tests
1.  **Route Protection**: Attempting to access `/priest/dashboard` as a devotee should redirect/block access.
2.  **Permissions**: Denying Gallery or Location permissions should trigger appropriate alerts and fallbacks.

## 6. Integration with Backend
1.  Ensure backend server is running (`npm run dev` in BMPserver).
2.  Verify API interceptors correctly attach Firebase JWT tokens.
3.  Check for "InternalBytecode.js" errors in Metro (expected/harmless).
