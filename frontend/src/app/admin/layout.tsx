import type { Metadata } from "next";
import AdminShell from "./_components/admin-shell";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  description: "Cinema admin dashboard",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminShell>{children}</AdminShell>;
}
