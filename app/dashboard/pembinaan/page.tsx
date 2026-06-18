import { requireRole } from "@/lib/auth";
import PembinaanManager from "@/components/PembinaanManager";

export const dynamic = "force-dynamic";

export default async function PembinaanPage() {
  await requireRole(["bk", "admin"]);
  return <PembinaanManager />;
}
