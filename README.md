# Sacred Connect (Frontend)

## Getting Started

1.  **Install dependencies:**
    ```bash
    npm install
    ```

## Running the App
To start the development server:

```bash
npx expo start
```

### Platform Specific
- **Android:** Press `a` in the terminal (requires Android Emulator or connected device)
- **iOS:** Press `i` in the terminal (requires Xcode Simulator or connected device)
- **Web:** Press `w` in the terminal

### Troubleshooting
If you encounter errors or changes aren't reflecting:

**Clear Cache:**
```bash
npx expo start -c
```
This is useful when:
- Installing new packages
- Editing `app.json` or `babel.config.js`
- Encountering "InternalBytecode" or metro bundler errors

## Features

### User Types
- **Devotees**: Book religious ceremonies and services
- **Priests**: Offer religious services and manage bookings

### Priest Signup
When registering as a priest, you'll be asked to:
- Provide basic information (name, email, phone, password)
- Select languages you speak from the top 20 Indian languages
- Complete your profile with additional details

### Language Selection
Priests can select multiple languages they speak from:
- Hindi, Bengali, Marathi, Telugu, Tamil
- Gujarati, Urdu, Kannada, Odia, Malayalam
- Punjabi, Assamese, Maithili, Bhojpuri
- And 6 more languages

## Test Credentials

Use these accounts to test the application flows (Priest & Devotee).

### Priests
*   **Priest 1 (Pandit Sharma - North Indian):**
    *   **Email:** `priest1@example.com`
    *   **Password:** `password123`
*   **Priest 2 (Acharya Mishra - South Indian):**
    *   **Email:** `priest2@example.com`
    *   **Password:** `password123`

### Devotees
*   **Devotee 1:**
    *   **Email:** `devotee1@example.com`
    *   **Password:** `password123`
*   **Devotee 2:**
    *   **Email:** `devotee2@example.com`
    *   **Password:** `password123`
*   **Devotee 3:**
    *   **Email:** `demo@example.com`
    *   **Password:** `Anish@123`

## Testing

For detailed information on running tests and understanding test cases, please refer to [TESTING.md](./TESTING.md).

To run the tests:
```bash
npm test
```

## Components

### Key Components
- **LanguagePicker**: Multi-select language picker for priest signup
- **InputField**: Reusable input field component
- **ReligiousTraditionPicker**: (Deprecated) Replaced by LanguagePicker

## Recent Updates
- ✅ Language selection feature for priest signup
- ✅ Multi-select language picker with native names
- ✅ Updated signup flow for priests
