import { getProfile } from "@/lib/auth";
import Shell from "@/components/Shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getProfile();
  return <Shell profile={profile}>{children}</Shell>;
}
