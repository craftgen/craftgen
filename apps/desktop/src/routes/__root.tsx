import {
  createRootRouteWithContext,
  Link,
  Outlet,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { AuthSession } from "@supabase/supabase-js";
import { supabase } from "../libs/supabase";

interface MyRouterContext {
  // The ReturnType of your useAuth hook or the value of your AuthContext
  auth: AuthSession;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  loader: async ({ context }) => {
    console.log({
      context
    })
    return { context };
  },
  component: (props) => (
    <>
      <div className="flex gap-2 p-2">
        {JSON.stringify(props, null, 2)}
        <Link to="/" className="[&.active]:font-bold">
          Home
        </Link>{" "}
        <Link to="/dashboard" className="[&.active]:font-bold">
          Dashboard
        </Link>
        <Link to="/about" className="[&.active]:font-bold">
          About
        </Link>
      </div>
      <hr />
      <Outlet />
      <TanStackRouterDevtools />
    </>
  ),
});

const UserNav: React.FC<{ session: AuthSession }> = ({ session }) => {
  return (
    <div>
      <Link to="/profile">Profile</Link>
      <Link to="/billing">Billing</Link>
      <Link to="/logout">Logout</Link>
    </div>
  );
};
