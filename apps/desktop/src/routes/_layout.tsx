import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_layout")({
  component: () => (
    <div>
      <div className="flex h-full w-full items-center justify-center bg-red-400">
        <div className="w-full max-w-5xl p-4">NAVBAR</div>
      </div>
      <Outlet />
    </div>
  ),
});
