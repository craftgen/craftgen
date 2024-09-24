import { createFileRoute, Link, Outlet } from "@tanstack/react-router";

import { Footer } from "@craftgen/ui/components/footer";
import { NavBar } from "@craftgen/ui/components/navbar";

export const Route = createFileRoute("/_public")({
  component: LayoutComponent,
});

function LayoutComponent() {
  return (
    <div className="p-2">
      {/* <NavBar /> */}
      <Outlet />
      {/* <Footer /> */}
    </div>
  );
}
