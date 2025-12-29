# Sacred Connect (Frontend)

## Getting Started

1.  **Install dependencies:**
    ```bash
    npm install
    ```

2.  **Run the app:**
    ```bash
    npx expo start
    ```

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
