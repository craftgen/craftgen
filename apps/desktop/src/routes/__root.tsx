import { AuthSession } from "@supabase/supabase-js";
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";

import { DashboardLayout } from "@craftgen/ui/layout/dashboard";
import { api } from "@craftgen/ui/lib/api";

interface MyRouterContext {
  // The ReturnType of your useAuth hook or the value of your AuthContext
  auth: AuthSession;
  client: ReturnType<typeof api.useUtils>;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
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
