import {
  createFileRoute,
  Link,
  Outlet,
  useNavigate,
} from "@tanstack/react-router";
import { isNil } from "lodash-es";

import { Button } from "@craftgen/ui/components/button";
import { Icons } from "@craftgen/ui/components/icons";
import { Sidebar } from "@craftgen/ui/components/sidebar";
import { DashboardLayout } from "@craftgen/ui/layout/dashboard";
import { Navbar } from "@craftgen/ui/views/navbar";
import { UserNav } from "@craftgen/ui/views/user-nav";

import { createClient } from "../libs/supabase";

const DashboardLayoutComponent = () => {
  const context = Route.useRouteContext();
  const navigate = useNavigate();
  const supabase = createClient();
  const handleLogout = async () => {
    await supabase.auth.signOut();
    // TODO: remove cookies  as well.
    navigate({ to: "/login" });
  };
  console.log("CONTEXT", context);
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
        <Navbar Link={Link}>
          {!isNil(context.auth?.user) ? (
            <UserNav Link={Link} handleLogout={handleLogout} />
          ) : (
            <Link to="/login">
              <Button> Sign up</Button>
            </Link>
          )}
        </Navbar>
        <Outlet />
      </DashboardLayout.Content>
    </DashboardLayout>
  );
};

export const Route = createFileRoute("/_layout")({
  component: DashboardLayoutComponent,
});
