# Sacred Connect — Project Decisions Log
Last updated: [date]

## Platform & Tech Stack
- React Native + Expo Router (file-based routing)
- Gluestack UI v2 + custom components
- Redux Toolkit (global state) + React Query (server state)
- Firebase Authentication (primary auth source)
- Axios with Firebase JWT interceptor
- MongoDB + Mongoose (backend)
- Razorpay payments (physical service exemption — iOS allowed)
- Cloudinary (media uploads)
- Socket.io (real-time)

## iOS Payment Decision
Razorpay approved for iOS under physical service marketplace exemption.
Same model as Uber and Swiggy.
UI copy rules: never use "purchase" or "buy" — always "Confirm Booking" 
and "Pay for Service."

## Admin Panel
Completely separate project. Not in scope for this rebuild.

## Deferred to Phase 2 (Do Not Build Yet)
- Instant priest search (requires real-time infra verification)
- Payout to bank account (backend not ready)
- Refund flow (cancellation policy not defined)
- In-app chat

## Services Not Offered (Do Not Promise in UI)
- Astrology consultation — removed from onboarding slide 3

## Auth Architecture Decision
Firebase onAuthStateChanged = only source of truth.
AsyncStorage = only stores hasLaunchedBefore boolean.
Redux = populated once from backend response, never used for routing.
Race condition fix = implemented in authStateManager.ts.

## Asset Architecture Decision
All images through AssetService.getImage('category.key').
Never import images with require() directly in components.
S3 migration = change ASSET_BASE_URL env variable only. 
No component changes needed.

## UI Decisions
- Floating label inputs across all forms (not static labels)
- Saffron gradient (#FF9933 → #E65C00) for all primary CTAs
- Warm cream background (#FAFAF7) throughout
- Logo: single Logo.tsx component, never recreated inline
- Input validation fires onBlur, not onChange

## Antigravity Setup
- Tool: Antigravity 2.0 (Google IO 2026)
- Context file: AGENTS.md in project root
- Skills: .antigravity/skills/ (3 SKILL.md files)
- Model: Gemini 3.5 Flash (logic/backend), Claude Sonnet 4.6 (UI)
- Mode: Planning Mode always
- Quota pools: Gemini and Claude are separate pools

## Approved Screen Count
Total: 46 screens across auth, devotee, priest sections.
Full list in AGENTS.md PAGE_MAP_V1.

## Build Status
Phase: Frontend Rebuild
Branch: v2-rebuild (sacred-connect repo)
Backend: v1-legacy frozen, main untouched (BMPserver repo)

### Completed
- [x] Auth flow — all 14 test points verified

### Next Up
- [ ] Priest Onboarding Wizard
- [ ] Devotee Home Tab
- [ ] [continues per page map]