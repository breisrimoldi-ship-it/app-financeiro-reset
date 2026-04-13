import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import OnboardingClient from "./ui";

export default async function RendaVariavelOnboardingPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { count: lancamentosCount } = await supabase
    .from("rv_lancamentos")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  if ((lancamentosCount ?? 0) > 0) {
    redirect("/renda-variavel");
  }

  return <OnboardingClient />;
}
