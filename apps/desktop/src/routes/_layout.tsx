import { createFileRoute, Link, Outlet } from "@tanstack/react-router";

import { Icons } from "@craftgen/ui/components/icons";
import { Sidebar } from "@craftgen/ui/components/sidebar";
import { DashboardLayout } from "@craftgen/ui/layout/dashboard";
import { Navbar } from "@craftgen/ui/views/navbar";

const DashboardLayoutComponent = () => {
  const context = Route.useRouteContext();
  return (
    <DashboardLayout>
      <Sidebar
        Link={Link}
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
        <Navbar session={context.auth} Link={Link} />
        <div className="mt-20">
          <Outlet />
        </div>
      </DashboardLayout.Content>
    </DashboardLayout>
  );
};

export const Route = createFileRoute("/_layout")({
  component: DashboardLayoutComponent,
});
