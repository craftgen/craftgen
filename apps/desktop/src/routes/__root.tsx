import { AuthSession } from "@supabase/supabase-js";
import {
  createRootRouteWithContext,
  Link,
  Outlet,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";

import { Icons } from "@craftgen/ui/components/icons";
import { Sidebar } from "@craftgen/ui/components/sidebar";

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
      <div className="flex min-h-screen w-full flex-col bg-muted/40">
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
        <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
          <Outlet />
        </div>
      </div>

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
