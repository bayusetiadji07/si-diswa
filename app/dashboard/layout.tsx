import { getProfile } from "@/lib/auth";
import Shell from "@/components/Shell";
import PushRegister from "@/components/PushRegister";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getProfile();
  return (
    <Shell profile={profile}>
      <PushRegister />
      {children}
    </Shell>
  );
}
