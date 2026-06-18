import { redirect } from "next/navigation";

export default function Home() {
  // Middleware redirects authenticated users to /dashboard; everyone else here.
  redirect("/dashboard");
}
