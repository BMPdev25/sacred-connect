# Frontend Testing Documentation

## Overview
The `sacred-connect` frontend uses **Jest** as the test runner and **React Native Testing Library** for component testing.

## Running Tests
To run the test suite:
```bash
npm test
```

To run tests in watch mode:
```bash
npm test -- --watch
```

## Test Structure

### Component Tests (`__tests__/`)
Tests for individual React Native components to ensure they render correctly and handle user interactions.

*   **`Colors.test.ts`**:
    *   **Purpose**: Validates that the color constants are defined correctly.
    *   **Cases**: Ensures `APP_COLORS` object contains expected color values.

## Components to Test

### Authentication Components
- **LanguagePicker**: Multi-select language picker for priest signup
  - Should render list of languages
  - Should allow multiple selections
  - Should validate at least one selection for priests

### Profile Components
- **ProfileCompletionBanner**: Progress bar and messaging for profile completion
  - Should display correct completion percentage
  - Should show appropriate message based on completion level
  - Should display missing fields
  - Should show verification status badges
  - Should be dismissible
  - Should navigate to profile setup on button click
  - Should hide when completion is 100%

### Priest Screens
- **ProfileSetup**: Multi-step profile setup form
  - Should load ceremonies from API
  - Should display loading state while fetching
  - Should show empty state if no ceremonies
  - Should allow ceremony selection
  - Should validate required fields
  - Should save profile data correctly

## Manual Testing Procedures

### Language Selection Feature
1. Navigate to priest signup
2. Verify language picker displays list of languages
3. Select multiple languages
4. Verify selected languages are highlighted
5. Attempt to proceed without selecting languages (should fail)
6. Complete signup with languages selected
7. Verify languages are saved in user profile

### Profile Completion Feature
1. **New Priest Signup**:
   - Sign up as a new priest with basic info and languages
   - Navigate to home screen
   - Verify profile completion banner appears
   - Should show ~20% completion (basic info + languages)
   - Should display missing fields list

2. **Profile Completion Flow**:
   - Tap "Complete Profile" button
   - Navigate through profile setup steps
   - Add profile picture → verify percentage increases
   - Add description → verify percentage increases
   - Add services → verify percentage increases
   - Set location → verify percentage increases
   - Upload documents → verify percentage reaches 100%
   - Return to home screen → banner should disappear

3. **Profile Tab**:
   - Navigate to Profile tab
   - Verify profile loads without errors
   - Verify "Verification Documents" section displays
   - Upload government ID → verify status updates
   - Upload religious certificate → verify status updates

4. **Services & Pricing**:
   - Navigate to ProfileSetup → Services & Pricing
   - Verify ceremonies load correctly
   - Verify loading indicator appears while fetching
   - Select ceremonies with checkboxes
   - Set prices for selected ceremonies
   - Save and verify services are stored

## Test Coverage

Current test coverage:
- ✅ Color constants validation
- ⏳ Language picker component (planned)
- ⏳ Profile completion banner (planned)
- ⏳ Profile setup form validation (planned)

## Future Test Additions

Planned component tests:
- Authentication flows (signup, login)
- Booking creation and management
- Payment integration
- Notification handling
- Search and filter functionality
- Map integration

## Running Specific Tests

Run all tests:
```bash
npm test
```

Run specific test file:
```bash
npx jest __tests__/Colors.test.ts
```

Run tests with coverage:
```bash
npm test -- --coverage
```

## Integration with Backend

Frontend tests should mock API calls using Jest mocks. For integration testing with the actual backend:
1. Ensure backend server is running (`npm run dev` in BMPserver)
2. Use manual testing procedures above
3. Verify API responses in network tab
4. Check backend logs for errors

## Known Issues

- **InternalBytecode.js Error**: Harmless Metro bundler error during development, does not affect functionality
- **API Warnings**: Expected warnings for new accounts (bookings, earnings, notifications) are normal

## Recent Updates
- ✅ Added LanguagePicker component for priest signup
- ✅ Updated signup flow to use language selection
- ✅ Added ProfileCompletionBanner component
- ✅ Added loading states to ceremony selection in ProfileSetup
- ✅ Fixed ProfileTab syntax errors
