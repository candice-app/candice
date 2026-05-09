"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import OnboardingFlow from "./OnboardingFlow";

const REPLAY_KEY = "candice_replay_tour";

export default function TourReplay() {
  const [userId, setUserId] = useState<string | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(REPLAY_KEY) !== "true") return;
    localStorage.removeItem(REPLAY_KEY);
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUserId(data.user.id);
        setShow(true);
      }
    });
  }, []);

  if (!show || !userId) return null;

  return (
    <OnboardingFlow
      userId={userId}
      userName=""
      onComplete={() => setShow(false)}
    />
  );
}
