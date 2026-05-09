import { createClient } from "@/utils/supabase/client";

export type PointActionType =
  | "registration"
  | "profile_complete"
  | "profile_update"
  | "contact_created"
  | "friend_invited"
  | "date_added"
  | "feedback"
  | "attention_executed"
  | "shared_profile_complete";

const POINT_VALUES: Record<PointActionType, number> = {
  registration: 500,
  profile_complete: 1000,
  profile_update: 50,
  contact_created: 200,
  friend_invited: 200,
  date_added: 50,
  feedback: 100,
  attention_executed: 100,
  shared_profile_complete: 500,
};

export async function awardPoints(userId: string, actionType: PointActionType): Promise<void> {
  const points = POINT_VALUES[actionType];
  const supabase = createClient();
  await supabase.from("user_points").insert({ user_id: userId, action_type: actionType, points });
}
