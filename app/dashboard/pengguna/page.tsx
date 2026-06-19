import { requireRole } from "@/lib/auth";
import PenggunaManager from "@/components/PenggunaManager";

export const dynamic = "force-dynamic";

export default async function PenggunaPage() {
  const profile = await requireRole(["admin"]);
  return <PenggunaManager currentUserId={profile.id} />;
}
