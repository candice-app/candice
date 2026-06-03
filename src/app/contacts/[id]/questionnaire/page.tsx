import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import IncognitoFlow from "./IncognitoFlow";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function IncognitoQuestionnairePage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: contact } = await supabase
    .from("contacts")
    .select("id, name, gender, relationship_register, proche_user_id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!contact) redirect("/contacts");

  // If contact has linked to their own account, the pilote-filled flow doesn't apply
  if (contact.proche_user_id) redirect(`/contacts/${id}`);

  const { data: existingResponse } = await supabase
    .from("questionnaire_responses")
    .select("*")
    .eq("contact_id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    <IncognitoFlow
      contactId={id}
      contactName={contact.name}
      contactGender={contact.gender ?? null}
      existingResponse={existingResponse ?? null}
    />
  );
}
