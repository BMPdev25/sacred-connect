# Comprehensive Frontend Test Plan for Sacred Connect

This document outlines a complete testing strategy for the Sacred Connect frontend application. It covers unit testing, integration testing, and end-to-end (E2E) scenarios to ensure robustness across all user paths.

## 1. Testing Strategy Overview

The testing strategy is divided into three layers:
1.  **Unit Tests**: Testing individual functions, hooks, and atomic components in isolation.
2.  **Integration Tests**: Testing interactions between components and navigation flows within screens.
3.  **End-to-End (E2E) / Manual Scenarios**: comprehensive workflows simulating real user behavior.

### Tools
-   **Test Runner**: Jest
-   **Component Testing**: React Native Testing Library (RNTL)
-   **Mocking**: Jest Mocks (for API services `api/*`, `services/*`)

---

## 2. Unit Testing Plan

### 2.1 Shared Components (`/components`)
Verify rendering, props handling, and internal logic.

| Component | Test Scenarios | Priority |
| :--- | :--- | :--- |
| **Button** | - Renders correct text/icon<br>- Handles `onPress` events<br>- Displays loading state (spinner)<br>- Verify disabled state styling and non-interactivity | High |
| **InputField** | - Renders label and placeholder<br>- Handles text input changes<br>- Displays error messages correctly<br>- Handles secure text entry (password visibility toggle) | High |
| **ErrorMessage** | - Renders nothing if error is null/empty<br>- Renders text with correct styling if error exists | Medium |
| **LanguagePicker** | - Renders list of options<br>- Allows multiple selections<br>- Searching/Filtering languages (if applicable)<br>- Validation (min selection) | High |
| **ProfileCompletionBanner** | - Calculates/Displays correct % based on props<br>- Shows correct missing fields<br>- "Complete Now" button triggers navigation<br>- Hidden when % is 100 | Medium |
| **ReligiousTraditionPicker** | - Render varied traditions<br>- Selection logic (Single/Multi) | Medium |
| **SkeletonCard** | - Renders correct number of placeholders<br>- Animation active state | Low |

### 2.2 detailed Service Logic (`/services`)
Mock `axios`/`fetch` to verify service methods handle responses and errors correctly.

| Service | Test Scenarios |
| :--- | :--- |
| **authServices** | - `login`: Successful token storage, Handle 401/400 errors<br>- `signup`: Handle validation errors, Success flow |
| **bookingService** | - `createBooking`: Verify payload structure<br>- `getBookings`: specific filters (upcoming vs past) |
| **priestService** | - `updateProfile`: Verify multipart/form-data if image upload involved<br>- `getPriestDetails`: Handle 404/Empty states |

---

## 3. Integration & Screen Testing

### 3.1 Authentication Module (`app/(auth)`)
**Files**: `login.tsx`, `signup.tsx`

*   **Login Flow**:
    *   **Path**: Enter valid Email -> Click Login -> Expect Redirect to Home.
    *   **Path**: Enter valid Phone -> Click Login -> Expect Redirect to Home.
    *   **Path**: Empty fields -> Click Login -> Expect Validation Errors.
    *   **Path**: Invalid Credentials -> Expect Toast/Error Message.
    *   **Path**: Click "Sign Up" -> Expect Navigation to Signup Screen.

*   **Signup Flow**:
    *   **Path**: Toggle logic (Devotee vs Priest).
    *   **Path**: Form Validation (Password mismatch, invalid email).
    *   **Path**: Successful Signup -> Expect Redirect to Onboarding/Home.

### 3.2 Devotee Module (`app/(devoteeScreens)`)

*   **Global Search (`GlobalSearch.tsx`)**:
    *   Wrapper integration test with mocked `searchService`.
    *   Input query -> Verify Service Call -> Render Results List.
    *   Empty Result State -> "No priests found".

*   **Priest Profile & Booking**:
    *   **Flow**: Select Priest -> View Details (`(priest)/[id]`) -> Click Book.
    *   **Booking Form**: Date Selection -> Service Selection -> Payment Method -> Confirm.

### 3.3 Priest Module (`app/(priestScreens)`)

*   **Profile Setup (`ProfileSetup.tsx`)**:
    *   **Complex Flow**: This is a multi-step form.
    *   Step 1 (Basic Info) -> Validation -> Next.
    *   Step 2 (Services) -> Add/Remove Service -> Calculate Pricing -> Next.
    *   Step 3 (Documents) -> Mock Upload -> Finish.
    *   **State Persistence**: Verify data survives between step navigation.

*   **Dashboard & Availability**:
    *   Toggle "Go Online" -> Verify API call to update status.
    *   Dashboard Stats -> component renders correct mocked numbers.

---

## 4. End-to-End (E2E) & Manual Path Scenarios

These scenarios cover the "User Stories" and should be tested manually or via E2E tools (like Detox/Appium) if available.

### Scenario A: The New Devotee Journey
1.  **Sign Up**: Create account as "Devotee".
2.  **Search**: Search for "Puja" in "New Delhi".
3.  **Browse**: Click on a Priest card to view details.
4.  **Booking**:
    *   Select "Satyanarayan Puja".
    *   Select Date: Next Sunday.
    *   Confirm Booking.
5.  **Verification**: Go to "My Bookings" tab -> Verify status is "Pending".

### Scenario B: The Priest Onboarding & Acceptance
1.  **Sign Up**: Create account as "Priest".
2.  **Onboarding**: Complete Profile (Upload Placeholder ID, Select "Vedic" tradition).
3.  **Go Online**: Toggle "Online" switch (Expect prompt if profile incomplete).
4.  **Receive Booking**:
    *   (Requires Scenario A to be run against this user).
    *   Check "Requests" tab.
    *   **Action**: Accept Booking.
5.  **Completion**:
    *   Navigate to "Schedule".
    *   Mark Booking as "Completed".
    *   Check "Earnings" (Mocked increase).

### Scenario C: Edge Cases & Error Handling
1.  **Network Failure**: Turn off Wifi/Data -> Try to Book -> Expect "No Internet Connection" toast.
2.  **Token Expiry**: Simulate expired token -> Try to access Profile -> Expect Redirect to Login.
3.  **Empty States**:
    *   New User -> "My Bookings" should show "No Bookings Yet" illustration.
    *   Search -> Random string "xyz123" -> "No Results Found".
4.  **Input Limits**:
    *   Profile Bio: Enter > 500 chars -> Expect truncation or warning.
    *   Phone Number: Enter text in number field -> Expect rejection.

## 5. Security & Permission Tests (Manual)
1.  **Route Protection**: Try to navigate to `/priest/dashboard` while logged in as Devotee. (Expect redirect/403).
2.  **Permissions**:
    *   Try to upload image without Gallery Permission -> Expect Permission Request Alert.
    *   Try to use "Near Me" without Location Permission -> Expect Request/Fallback.

## 6. Implementation Checklist for QA
- [ ] Run `npm test` to verify all existing unit tests pass.
- [ ] Implement missing Unit Tests for `ProfileSetup.tsx` (Critical Priority).
- [ ] Implement missing tests for `authServices.ts`.
- [ ] Perform Manual Walkthrough of Scenario A & B on Android Emulator.
- [ ] Perform Manual Walkthrough of Scenario A & B on iOS Simulator (if available).
