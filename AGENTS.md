# Sacred Connect — Agent Rules & Project Context

## What This App Is
Sacred Connect is a React Native + Expo Router marketplace app for booking 
priests (pandits) for religious ceremonies in India. Two user roles: Devotee 
(books services) and Priest (provides services). Backend: Node.js + Express + 
MongoDB. Payment: Razorpay (physical service exemption, not Apple IAP).

## Tech Stack (Locked — Do Not Change)
- Frontend: React Native, Expo SDK, Expo Router (file-based routing)
- State: Redux Toolkit (global), React Query (server state), React Context 
  (notifications, sockets)
- UI: Gluestack UI v2 + custom components
- Styling: Theme tokens from constants/theme.ts ONLY — no hardcoded colors
- HTTP: Axios with Firebase JWT interceptor
- Auth: Firebase Authentication (primary), Custom JWT (fallback)
- Assets: Local folder assets/ (S3 migration planned — see Asset Rules)

## Project Structure
This is a two-repo project:
- Frontend: sacred-connect/ (this repo — the one you are working in)
- Backend: BMPserver/ (sibling folder — READ ONLY, never modify)

When you need to verify an API endpoint, route, or response shape:
Read from ../BMPserver/routes/ and ../BMPserver/controllers/
Never create, edit, or delete files in ../BMPserver/

Backend base URL: stored in .env as API_BASE_URL
All API calls use the Axios instance at api/index.ts

## Routing Structure
app/
  (auth)/          — Splash, Onboarding, Login, Signup, OTP, ForgotPassword
  devotee/
    (tabs)/        — HomeTab, ExploreTab, BookingsTab, ProfileTab
    (screens)/     — Booking flow, Priest detail, Payment, Addresses
  priest/
    (tabs)/        — HomeTab, RequestsTab, CalendarTab, EarningsTab, ProfileTab
    onboarding/    — Wizard steps 1–6, VerificationStatus
    (screens)/     — RequestDetail, BookingDetail, EditServices, EditAvailability

## Code Quality Rules (Non-Negotiable)
1. No function longer than 40 lines. Break complex logic into named sub-functions.
2. No component file longer than 200 lines. Extract sub-components.
3. Single responsibility: one function does one thing.
4. Every async function has try/catch. No silent failures.
5. No magic numbers or strings — use constants from theme.ts or dedicated 
   constants files.
6. No inline styles — all styles in StyleSheet.create() at bottom of file.
7. API calls never live inside components — always in services/ layer.
8. Business logic never lives in controllers/routes — always in services/ layer.
9. Every exported function and component has a JSDoc comment.
10. Types over any — use TypeScript types for all props, state, and API responses.

## Asset Rules (Critical — Read Before Any Image/PDF Reference)
All local assets live in: assets/
  assets/images/
    auth/          — splash, onboarding slides, forgot-password illustrations
    devotee/       — home banners, ceremony category icons, empty states
    priest/        — onboarding illustrations, verification graphics
    shared/        — logo, icons, placeholder avatars
  assets/icons/    — SVG icons
  assets/fonts/    — custom fonts

NEVER import images directly in components like:
  require('../../assets/images/splash.png')  ← WRONG

ALWAYS use the AssetService:
  import { AssetService } from '@/services/assets/AssetService'
  const splashImage = AssetService.getImage('auth.splash')

This abstraction means when we migrate to S3, only AssetService changes.
No component imports change.

Same rule applies to PDFs:
  DocumentService.getDocument('policy.terms')  ← correct pattern

## Shared Components (Always Use These — Never Recreate)
components/shared/
  Logo.tsx           — Sacred Connect logo, variants: 'full' | 'icon-only'
  FloatingInput.tsx  — All text inputs, floating label style
  PrimaryButton.tsx  — All primary CTAs, saffron gradient
  LoadingSpinner.tsx — All loading states

## Auth Rule (Critical)
Firebase onAuthStateChanged is the ONLY source of auth truth.
AsyncStorage stores ONLY the hasLaunchedBefore boolean.
Redux is populated ONCE from backend response — never used for routing decisions.
Never call onAuthStateChanged more than once simultaneously.

## API Response Format (All endpoints must follow this)
Success: { success: true, data: {...}, message: string }
Error:   { success: false, error: string, code: string }

## Back Button Rule
Back buttons are always absolutely positioned.
Never in the document flow.
Position: absolute, top: insets.top + 8, left: 16, zIndex: 10
ScrollView paddingTop compensates: insets.top + 56
Import useSafeAreaInsets from react-native-safe-area-context.

## What Is NOT In Scope (Do Not Build)
- Admin panel (completely separate project)
- Astrology consultation
- In-app chat
- Instant booking — IMPLEMENTED (instant/scheduled date-window split, broadcast, head-start, 10-min TTL, SearchingForPriest screen). See bookingSlice.ts and InstantBookingSetup.tsx.
- Priest payout to bank (backend not ready)