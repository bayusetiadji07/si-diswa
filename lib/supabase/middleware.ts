import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { canAccess, type Role } from "@/lib/types";

/**
 * Refreshes the Supabase session cookie and enforces role-based access.
 * Returns the response to send (possibly a redirect).
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isLogin = path === "/login";
  const isProtected = path.startsWith("/dashboard");

  // Not signed in -> only /login is allowed for protected areas.
  if (!user) {
    if (isProtected) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
    return response;
  }

  // Signed in: resolve role from profil_users.
  const { data: profile } = await supabase
    .from("profil_users")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = (profile?.role as Role) ?? "siswa";

  // Already authenticated visiting /login or root -> go to dashboard.
  if (isLogin || path === "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // Enforce RBAC on dashboard sub-routes.
  if (isProtected && !canAccess(role, path)) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return response;
}
