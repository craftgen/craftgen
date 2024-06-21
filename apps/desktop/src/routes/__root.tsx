import { AuthSession } from "@supabase/supabase-js";
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";

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
        <Outlet />
      </DashboardLayout>
      {import.meta.env.DEV && (
        <TanStackRouterDevtools position="bottom-right" />
      )}
    </>
  ),
});
