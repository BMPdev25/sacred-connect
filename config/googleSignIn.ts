// config/googleSignIn.ts
//
// One-time GoogleSignin configuration. Requires a Web client ID from
// Firebase Console -> Authentication -> Sign-in method -> Google (this
// generates a Web OAuth client automatically; the project's current
// google-services.json has an EMPTY oauth_client array, meaning Google
// Sign-In has never been enabled there yet — enable it and re-download
// google-services.json before this can work on a device).
//
// Also requires a custom dev client / EAS build — the native Google
// Sign-In module cannot run inside Expo Go.
import { GoogleSignin } from '@react-native-google-signin/google-signin';

const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

let configured = false;

/** Configures GoogleSignin exactly once, lazily, on first use. */
export function ensureGoogleSignInConfigured(): void {
  if (configured) return;
  if (!WEB_CLIENT_ID) {
    throw new Error(
      'Google Sign-In is not configured: EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID is missing. ' +
        'Enable Google as a sign-in provider in the Firebase console, then set this env var to the generated Web client ID.'
    );
  }
  GoogleSignin.configure({
    webClientId: WEB_CLIENT_ID,
    offlineAccess: false,
  });
  configured = true;
}
