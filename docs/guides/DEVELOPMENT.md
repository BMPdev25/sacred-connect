# Developer Guide: Workflows & Troubleshooting

This document outlines the standard development process and provides solutions for common errors encountered in the Sacred Connect project.

---

## 1. Development Workflow (Dev → Test → Fix)

To maintain high code quality, always follow this loop when implementing new features or refactors:

1.  **Develop**: Implement code changes based on the current task or phase.
2.  **Test**: Execute tests to verify changes.
    *   **Frontend**: `npm test` in the root directory.
    *   **Backend**: `npm test` in the `BMPserver` directory.
3.  **Log**: If tests fail, document the specific failure (file, test name, and error message).
4.  **Fix**: Apply targeted fixes for the identified bugs. *Avoid re-implementing entire features.*
5.  **Re-Test**: Run the test suite again.
6.  **Loop**: Repeat until all tests pass 100% cleanly.

---

## 2. Common Troubleshooting

### 2.1 Authentication & Profile
| Issue | Root Cause | Solution |
| :--- | :--- | :--- |
| **401 Unauthorized** | JWT token expired or invalid. | App handles this automatically by logging out and redirecting to `/login`. Manually log out and back in if issues persist. |
| **Profile Not Found (404)** | Missing Priest profile document. | The backend auto-creates a profile document on first access. Ensure the user is registered correctly. |
| **Profile Update Failed** | Missing required fields or invalid format. | Check that Email, Phone (10 digits), and Name are present. Priests must select at least one ceremony and one language. |

### 2.2 Connectivity & Environment
| Issue | Root Cause | Solution |
| :--- | :--- | :--- |
| **Network Error / Timeout** | Backend server is down or unreachable. | 1. Ensure `BMPserver` is running (`npm run dev`).<br>2. Verify `getBaseURL()` in `api/index.ts` matches your machine's IP. |
| **MongoDB Connection** | MongoDB service is not running. | Start the MongoDB service on your local machine (`net start MongoDB` on Windows). |
| **Metro Bundler Errors** | Cache issues or `InternalBytecode` missing. | Restart the bundler with a clean cache: `npx expo start -c`. |

### 2.3 Data & UI
| Issue | Root Cause | Solution |
| :--- | :--- | :--- |
| **Ceremonies Not Loading** | Database is empty (no ceremonies seeded). | Run the seed script: `node scripts/seedCeremonies.js` in the backend folder. |
| **UI Not Reflecting Changes** | Redux state or local cache is stale. | 1. Use pull-to-refresh on the screen.<br>2. Restart the app on the emulator/device. |

---

## 3. Best Practices
*   **Always use the Logout button** instead of just force-closing the app to ensure clean session teardown.
*   **Check Console Logs** in both the terminal (backend) and the React Native Debugger (frontend) for detailed error stacks.
*   **Seed Data** after any major database schema changes or a fresh installation.
