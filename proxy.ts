import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  // Skip Next internals and any path containing a dot (static files like
  // /logo.png, *.svg) so public assets are served directly.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
