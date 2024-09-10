import { cookies } from "next/headers";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";

import type { Database } from "@craftgen/db/db/database.types";
import { Icons } from "@craftgen/ui/components/icons";
import { Sidebar } from "@craftgen/ui/components/sidebar";
// import { Navbar } from "./navbar";
import { DashboardLayout } from "@craftgen/ui/layout/dashboard";

// import { persistGoogleToken } from "./actions";
// import { Navbar } from "./navbar";

export const dynamic = "force-dynamic";
export const revalidate = 10;
const Layout = async ({ children }: { children: React.ReactNode }) => {
  const session = auth();
  // if (session?.provider_refresh_token && session?.provider_token) {
  //   await persistGoogleToken();
  // }
  return (
    <DashboardLayout>
      {/* <main className="flex flex-col">
        <Navbar session={session!} />
        <div className="relative mt-12 min-h-[calc(100vh-3rem)] flex-1 bg-gray-100 dark:bg-muted">
          <div className="m-4 min-h-[calc(100vh-6rem)] rounded-lg bg-white p-4 shadow-lg dark:bg-background">
            {children}
          </div>
        </div>
      </main> */}
      <Sidebar
        Link={Link}
        logoLinkProps={{
          href: `/${session?.sessionClaims?.orgSlug}`,
        }}
        topLinks={[
          {
            label: "Explore",
            icon: <Icons.globe className="h-5 w-5" />,
            linkProps: { href: "/explore" },
          },
        ]}
        bottomLinks={[]}
      />
      <DashboardLayout.Content>
        {/* <Navbar session={session!} /> */}
        {children}
      </DashboardLayout.Content>
    </DashboardLayout>
  );
};

export default Layout;
