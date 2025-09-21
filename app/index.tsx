import { Redirect } from 'expo-router';

export default function IndexRedirect() {
  // Use a static Redirect so navigation happens after the router is ready
  return <Redirect href="/splash" />;
}
