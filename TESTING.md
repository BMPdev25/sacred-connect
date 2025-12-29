# Testing Documentation

## Overview
The `sacred-connect` frontend uses **Jest** with **Jest-Expo** for unit and snapshot testing of React Native components and logic.

## Running Tests
To run the test suite:
```bash
npm test
```

## Test Structure & Descriptions

### 1. Unit Tests (`__tests__/`)
These tests verify individual functions, constants, or logic isolated from the UI.

*   **`Colors.test.ts`**:
    *   **Purpose**: Validates the centralized Color constants.
    *   **Cases**:
        *   `should have primary color`: Checks that the primary brand color is correctly defined.
        *   `should have white and black defined`: Ensures basic color tokens are present.

### 2. Component Tests (Planned)
Future tests will cover:
*   **LanguagePicker Component**: Multi-select language picker functionality
*   **Signup Flow**: Priest and devotee registration flows
*   **Authentication**: Login and logout flows
*   **InputField Component**: Reusable input validation

## Manual Testing

### Priest Signup Flow
1. Open the app and navigate to signup
2. Select "Priest" as user type
3. Fill in basic information (name, email, phone, password)
4. Select one or more languages from the language picker
5. Verify that:
   - Language picker shows all 20 Indian languages
   - Selected languages are displayed with a count badge
   - Form validation requires at least one language
   - Signup succeeds with selected languages

### Language Picker
- Tap the language picker to open the modal
- Select/deselect languages using checkboxes
- Verify the badge shows the correct count
- Tap "Done" to close the modal
- Verify selected languages are displayed

## Recent Updates
- ✅ Added LanguagePicker component for priest signup
- ✅ Updated signup flow to use language selection
- ✅ Removed ReligiousTraditionPicker (deprecated)

*(More automated tests for Components and Services will be added as development progresses)*
