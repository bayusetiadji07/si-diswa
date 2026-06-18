import { requireRole } from "@/lib/auth";
import LaporanTabs from "@/components/LaporanTabs";

export const dynamic = "force-dynamic";

export default async function LaporanPage() {
  await requireRole(["guru", "bk", "admin"]);
  return <LaporanTabs />;
}
