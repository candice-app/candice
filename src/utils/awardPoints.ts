import { createClient } from "@/utils/supabase/client";

export type PointActionType =
  | "profile_complete"
  | "profile_update"
  | "friend_invited"
  | "attention_executed";

const POINT_VALUES: Record<PointActionType, number> = {
  profile_complete: 1000,
  profile_update: 50,
  friend_invited: 200,
  attention_executed: 100,
};

export async function awardPoints(userId: string, actionType: PointActionType): Promise<void> {
  const points = POINT_VALUES[actionType];
  const supabase = createClient();
  await supabase.from("user_points").insert({ user_id: userId, action_type: actionType, points });
}
