import { requireRole } from "@/lib/auth";
import PeraturanManager from "@/components/PeraturanManager";

export const dynamic = "force-dynamic";

export default async function PeraturanPage() {
  await requireRole(["bk", "admin"]);
  return <PeraturanManager />;
}
