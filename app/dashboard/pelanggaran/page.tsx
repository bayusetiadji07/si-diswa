import { requireRole } from "@/lib/auth";
import MonitoringTable from "@/components/MonitoringTable";

export const dynamic = "force-dynamic";

export default async function PelanggaranPage() {
  await requireRole(["bk", "admin"]);
  return <MonitoringTable />;
}
