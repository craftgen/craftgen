import { createFileRoute, Outlet } from "@tanstack/react-router";

import { Icons } from "@craftgen/ui/components/icons";
import { DashboardLayout } from "@craftgen/ui/layout/dashboard";
import { Sidebar } from "@craftgen/ui/components/sidebar";

export const Route = createFileRoute("/_layout")({
  component: LayoutComponent,
});

function LayoutComponent() {
  return (
    <DashboardLayout>
      <Sidebar
        logoLinkProps={{
          to: "/",
        }}
        topLinks={[
          {
            label: "Dashboard",
            icon: <Icons.home className="h-5 w-5" />,
            linkProps: { to: "/" },
          },
          {
            label: "Projects",
            icon: <Icons.package2 className="h-5 w-5" />,
            linkProps: { to: "/explore" },
          },
          {
            label: "Package",
            icon: <Icons.code className="h-5 w-5 text-red-500" />,
            linkProps: { to: "/package" },
          },
          ...(import.meta.env.DEV ? [] : []),
        ]}
        bottomLinks={[
          {
            label: "Settings",
            icon: <Icons.settings className="h-5 w-5" />,
            linkProps: { to: "/settings" },
          },
        ]}
      />
      <DashboardLayout.Content>
        <div className="p-2">
            <Outlet />
        </div>
      </DashboardLayout.Content>
    </DashboardLayout>
  );
}
