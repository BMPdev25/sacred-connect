# Sacred Connect (Frontend)

Welcome to the **Sacred Connect** mobile application frontend. This project is built with Expo and React Native, designed to connect devotees with priests for religious ceremonies.

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the App
```bash
# Start Expo development server
npx expo start
```
*   **Android**: Press `a` (requires Emulator or connected device)
*   **iOS**: Press `i` (requires Xcode Simulator or connected device)
*   **Web**: Press `w`

---

## 📖 Documentation

The project documentation has been consolidated for better readability:

*   **[Developer Guide](./docs/guides/DEVELOPMENT.md)**: Standard workflows (Dev → Test → Fix) and troubleshooting common errors.
*   **[UI/UX Architecture](./docs/ui-ux/UI_UX_MAP.md)**: Complete maps for both **Devotee** and **Priest** user journeys.
*   **[Testing Guide](./docs/testing/README.md)**: Instructions for running Jest unit tests and manual verification procedures.

---

## 🛠️ Tech Stack & Features

*   **Core**: React Native (Expo), TypeScript, Redux Toolkit.
*   **Authentication**: Firebase Native Auth with automatic sync to MongoDB.
*   **Key Features**:
    *   **Unified Search**: Smart detection for Email/Phone login.
    *   **Priest Onboarding**: Multi-select language picker and profile completion tracking.
    *   **Service Management**: Dynamic pricing and ceremony requirement settings.
    *   **Real-time Alerts**: Push notifications for bookings and payments.

---

## 🧪 Test Credentials

Use these accounts to test the application flows.

### Priests
*   **Priest 1**: `priest1@example.com` / `password123`
*   **Priest 2**: `priest2@example.com` / `password123`

### Devotees
*   **Devotee 1**: `devotee1@example.com` / `password123`
*   **Devotee 3**: `demo@example.com` / `Anish@123`

---

## ✅ Recent Updates
*   **Architecture**: Consolidated all documentation into a structured `docs/` folder.
*   **UI/UX**: Enhanced booking cards with distance/travel time and added skeleton loaders.
*   **Onboarding**: Implemented progressive onboarding for priests with "Go Online" validation.
*   **Testing**: Added unit tests for identifier detection and UI components.
