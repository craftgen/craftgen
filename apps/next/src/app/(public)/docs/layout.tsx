import type { ReactNode } from "react";
import Link from "next/link";
import { DocsLayout } from "fumadocs-ui/layout";

import { Button } from "@craftgen/ui/components/button";
import { Icons } from "@craftgen/ui/components/icons";

import { pageTree } from "../../source";

export default function RootDocsLayout({ children }: { children: ReactNode }) {
  return (
    <DocsLayout
      tree={pageTree}
      sidebar={{
        banner: (
          <div className="flex w-full flex-col">
            <Link href="/discord">
              <Button variant={"outline"} className="w-full">
                <Icons.discord className="mr-4" />
                Community
              </Button>
            </Link>
          </div>
        ),
        // defaultOpenLevel: 2,
      }}
      nav={{
        enabled: false,
      }}
    >
      {children}
    </DocsLayout>
  );
}
