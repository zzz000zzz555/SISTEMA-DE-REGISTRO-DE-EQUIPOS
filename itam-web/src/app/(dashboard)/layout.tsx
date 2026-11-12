import { getCurrentUser, getUserPermissions } from "@/lib/auth";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { CommandPalette } from "@/components/layout/CommandPalette";
import { PermissionsProvider } from "@/lib/permissions-context";
import { redirect } from "next/navigation";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const perms = await getUserPermissions(user.id_usuario);

  return (
    <PermissionsProvider permissions={perms}>
      <div className="flex h-screen overflow-hidden">
        <Sidebar user={user} permissions={perms} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Topbar user={user} />
          <CommandPalette />
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </div>
    </PermissionsProvider>
  );
}