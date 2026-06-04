export const runtime = "nodejs";
import { AppLayout } from "@/components/layout";

export default function AppGroupLayout({ children }: { children: React.ReactNode }) {
  return <AppLayout>{children}</AppLayout>;
}
