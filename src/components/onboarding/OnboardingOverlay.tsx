"use client";

import { useEffect, useState } from "react";
import OnboardingFlow from "./OnboardingFlow";

interface Props {
  userId: string;
  userName: string;
}

const LS_KEY = "candice_onboarding_complete";

export default function OnboardingOverlay({ userId, userName }: Props) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(LS_KEY) !== "true") {
      setShow(true);
    }
  }, []);

  if (!show) return null;

  return (
    <OnboardingFlow
      userId={userId}
      userName={userName}
      onComplete={() => setShow(false)}
    />
  );
}
