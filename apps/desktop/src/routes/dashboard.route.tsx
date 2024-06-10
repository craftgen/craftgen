import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard")({
  beforeLoad: ({ context, location }) => {
    if (!context.auth) {
      throw redirect({
        to: "/login",
        search: {
          redirect: location.href,
        },
      });
    }
  },
  component: () => (
    <div>
      Dashboards
      <Outlet />
    </div>
  ),
});
