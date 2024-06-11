import { AuthSession } from "@supabase/supabase-js";
import {
  createRootRouteWithContext,
  Link,
  Outlet,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";

import { Icons } from "@craftgen/ui/components/icons";
import { Sidebar } from "@craftgen/ui/components/sidebar";
import { DashboardLayout } from "@craftgen/ui/layout/dashboard";

interface MyRouterContext {
  // The ReturnType of your useAuth hook or the value of your AuthContext
  auth: AuthSession;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  loader: async ({ context }) => {
    console.log({
      context,
    });
    return { context };
  },
  component: () => (
    <>
      <DashboardLayout>
        <Sidebar
          Link={Link}
          topLinks={[
            {
              label: "Dashboard",
              icon: <Icons.home className="h-5 w-5" />,
              linkProps: { to: "/" },
            },
            {
              label: "Projects",
              icon: <Icons.package2 className="h-5 w-5" />,
              linkProps: { to: "/about" },
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
          <Outlet />
        </DashboardLayout.Content>
      </DashboardLayout>

      {/* <main className="flex flex-col">
        <Navbar />
        <div className="relative mt-12 h-full min-h-[calc(100vh-3rem)] flex-1 bg-gray-100 dark:bg-muted">
          <div className="shadow-super m-4 min-h-[calc(100vh-6rem)] rounded-lg bg-white p-4 dark:bg-background">
            <Outlet />
          </div>
        </div>
      </main> */}
      <TanStackRouterDevtools />
    </>
  ),
});
