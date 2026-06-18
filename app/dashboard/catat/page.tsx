import { requireRole } from "@/lib/auth";
import CatatForm from "@/components/CatatForm";

export const dynamic = "force-dynamic";

export default async function CatatPage() {
  const profile = await requireRole(["guru", "bk"]);
  return <CatatForm guruId={profile.id} guruNama={profile.nama ?? ""} />;
}
