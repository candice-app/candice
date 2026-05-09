"use client";

import OnboardingFlow from "./OnboardingFlow";

interface Props {
  userId: string;
  userName: string;
}

export default function OnboardingOverlay({ userId, userName }: Props) {
  return (
    <OnboardingFlow
      userId={userId}
      userName={userName}
      onComplete={() => window.location.reload()}
    />
  );
}
