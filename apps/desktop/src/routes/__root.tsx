import { AuthSession } from "@supabase/supabase-js";
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@craftgen/ui/components/tooltip";
import { DashboardLayout } from "@craftgen/ui/layout/dashboard";
import { api } from "@craftgen/ui/lib/api";
import { cn } from "@craftgen/ui/lib/utils";

interface MyRouterContext {
  auth: AuthSession;
  client: ReturnType<typeof api.useUtils>;
  status: boolean;
}

const EdgeRuntimeStatus = () => {
  const status = Route.useRouteContext({ select: ({ status }) => status });
  console.log("STATUS", status);

  return (
    <div className="absolute right-4 top-4 z-[51]">
      <Tooltip>
        <TooltipTrigger>
          <div
            className={cn(
              "  h-2 w-2 rounded-full",
              status ? "bg-green-500" : "bg-red-500",
            )}
          />
        </TooltipTrigger>
        <TooltipContent>
          {status ? "Edge Runtime is running" : "Edge Runtime is not running"}
        </TooltipContent>
      </Tooltip>
    </div>
  );
};

export const Route = createRootRouteWithContext<MyRouterContext>()({
  component: () => {
    return (
      <>
        <DashboardLayout
          className={import.meta.env.DEV ? " border-x-4 border-red-500" : ""}
        >
          <Outlet />
        </DashboardLayout>
        <EdgeRuntimeStatus />

        {import.meta.env.DEV && (
          <>
            <TanStackRouterDevtools position="bottom-right" />
          </>
        )}
      </>
    );
  },
  notFoundComponent: () => <div>Not Found</div>,
});
