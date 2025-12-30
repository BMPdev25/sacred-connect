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

To run specific test file:
```bash
npm test -- __tests__/detectIdentifierType.test.ts
```

## Test Structure

### Component Tests (`__tests__/`)
Tests for individual React Native components to ensure they render correctly and handle user interactions.

*   **`Colors.test.ts`**:
    *   **Purpose**: Validates that the color constants are defined correctly.
    *   **Cases**: Ensures `APP_COLORS` object contains expected color values.

*   **`detectIdentifierType.test.ts`** ✅ NEW:
    *   **Purpose**: Tests the auto-detection logic for email vs phone number identification
    *   **Cases**: 
        - Email detection (with special characters, domains)
        - Phone number detection (plain, with country codes, formatted)
        - Edge cases (empty strings, mixed input)
        - Real-world examples (Indian phone numbers, common emails)

*   **`SkeletonCard.test.tsx`** ✅ NEW:
    *   **Purpose**: Tests the skeleton loader component
    *   **Cases**:
        - Component renders without crashing
        - All skeleton elements present
        - Animation initialization
        - Multiple instances render independently

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

### UX Refactoring Features (NEW)

#### 1. Login Screen Simplification
1. Navigate to login screen
2. Verify single "Email or Mobile Number" input field (no toggle)
3. Test email input: `test@example.com` → Should login successfully
4. Test phone input: `9876543210` → Should login successfully
5. Test formatted phone: `+91-98765-43210` → Should login successfully
6. Verify keyboard type is "default" (smart detection)

#### 2. Skeleton Loaders
1. Clear app cache/data
2. Login as priest
3. Navigate to Home tab
4. **Expected**: See 3 pulsing skeleton cards (NOT spinner)
5. Navigate to Bookings tab
6. **Expected**: See 4 pulsing skeleton cards while loading
7. Verify smooth transition to real content

#### 3. Enhanced Booking Cards
1. Navigate to Bookings tab
2. View any booking card
3. **Expected**: See distance (e.g., "5.2 km")
4. **Expected**: See travel time (e.g., "20 mins travel")
5. **Expected**: See location icon (near-me icon)
6. Verify layout is clean and readable

#### 4. Progressive Onboarding
1. Create new priest account via signup
2. **Expected**: Redirect to `/priest/HomeTab` (NOT ProfileSetup)
3. **Expected**: Profile completion banner visible at top
4. Tap "Go Online" toggle
5. **Expected**: Alert shows "Complete Your Profile" (if < 80%)
6. **Expected**: "Complete Now" and "Later" buttons in alert
7. Complete profile to 80%+
8. **Expected**: "Go Online" toggle becomes functional
9. Toggle to "Online"
10. **Expected**: Green background, "Online" text

#### 5. Schedule Agenda View
1. Navigate to Schedule tab
2. **Expected**: Calendar with week-focused view
3. Swipe left/right to navigate months
4. Tap on a date
5. **Expected**: Agenda list updates below calendar
6. **Expected**: Bookings grouped by time
7. Select date with no bookings
8. **Expected**: "No bookings for this day" message

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
- ✅ Identifier type detection (email vs phone) **NEW**
- ✅ Skeleton loader component **NEW**
- ⏳ Language picker component (planned)
- ⏳ Profile completion banner (planned)
- ⏳ Profile setup form validation (planned)
- ⏳ Go Online toggle logic (planned)

## Future Test Additions

Planned component tests:
- Authentication flows (signup, login)
- Booking creation and management
- Payment integration
- Notification handling
- Search and filter functionality
- Map integration
- Go Online toggle state management
- Progressive onboarding flow

## Running Specific Tests

Run all tests:
```bash
npm test
```

Run specific test file:
```bash
npx jest __tests__/Colors.test.ts
npx jest __tests__/detectIdentifierType.test.ts
npx jest __tests__/SkeletonCard.test.tsx
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

### Backend Integration Checklist
- ✅ Login endpoint accepts both email and phone
- ✅ Signup endpoint handles progressive onboarding
- ✅ Profile completion calculation works correctly
- ✅ Booking data includes all required fields
- ⏳ Distance/travel time calculation (currently mocked)

## Known Issues

- **InternalBytecode.js Error**: Harmless Metro bundler error during development, does not affect functionality
- **API Warnings**: Expected warnings for new accounts (bookings, earnings, notifications) are normal
- **TypeScript Errors**: 2 pre-existing errors in PriestSearch.tsx and PujariCard.tsx (unrelated to UX refactoring)

## Recent Updates
- ✅ Added LanguagePicker component for priest signup
- ✅ Updated signup flow to use language selection
- ✅ Added ProfileCompletionBanner component
- ✅ Added loading states to ceremony selection in ProfileSetup
- ✅ Fixed ProfileTab syntax errors
- ✅ **NEW**: Simplified login screen with auto-detection
- ✅ **NEW**: Added skeleton loaders (HomeTab, BookingsTab)
- ✅ **NEW**: Enhanced booking cards with distance/travel time
- ✅ **NEW**: Implemented progressive onboarding with Go Online toggle
- ✅ **NEW**: Optimized schedule view for mobile
- ✅ **NEW**: Created unit tests for identifier detection
- ✅ **NEW**: Created unit tests for SkeletonCard component
