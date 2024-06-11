import { AuthSession } from "@supabase/supabase-js";
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";

import { Navbar } from "../components/navbar";

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
      <main className="flex flex-col">
        <Navbar />
        <div className="relative mt-12 h-full min-h-[calc(100vh-3rem)] flex-1 bg-gray-100 dark:bg-muted">
          <div className="m-4 min-h-[calc(100vh-6rem)] rounded-lg bg-white p-4 shadow-lg dark:bg-background">
            <Outlet />
          </div>
        </div>
      </main>
      <TanStackRouterDevtools />
    </>
  ),
});
