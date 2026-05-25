import React from 'react';

import PriestOnboardingWizard from './onboarding/wizard';

/**
 * Main entrance screen for the priest onboarding page route.
 * Renders the multi-step onboarding wizard shell.
 */
export default function PriestOnboarding(): React.JSX.Element {
  return <PriestOnboardingWizard />;
}
