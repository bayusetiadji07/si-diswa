import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ProfilUser, Role } from "@/lib/types";

/** Returns the signed-in user's profile, or redirects to /login. */
export async function getProfile(): Promise<ProfilUser> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profil_users")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) {
    // Authenticated but no Si Diswa profile — treat as unauthorized.
    redirect("/login?error=no-profile");
  }

  return profile as ProfilUser;
}

/** Like getProfile but also enforces the role is in `allowed`. */
export async function requireRole(allowed: Role[]): Promise<ProfilUser> {
  const profile = await getProfile();
  if (!allowed.includes(profile.role)) {
    redirect("/dashboard");
  }
  return profile;
}
