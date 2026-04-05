// config/firebase.ts
import { initializeApp } from "firebase/app";
// @ts-ignore - The types definitions might be missing depending on tsconfig resolution
import { Auth, getAuth, initializeAuth, getReactNativePersistence } from "firebase/auth";
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

// Placeholder config - User will need to replace this with their actual config
const firebaseConfig = {
  apiKey: "AIzaSyD0QyJ2beoJz-IHwTx2Dm1InlZ4ob9Y9PM",
  authDomain: "bookmypujari-17c67.firebaseapp.com",
  projectId: "bookmypujari-17c67",
  storageBucket: "bookmypujari-17c67.firebasestorage.app",
  messagingSenderId: "188917761852",
  appId: "1:188917761852:web:24e17a972d9815bfd30039",
  measurementId: "G-CLS05XG6EC"
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with persistence
// We use a try-catch to avoid re-initialization errors if this file is imported multiple times or hot reloaded
let auth: Auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage)
  });
} catch (e) {
  auth = getAuth(app);
}

export { auth };
