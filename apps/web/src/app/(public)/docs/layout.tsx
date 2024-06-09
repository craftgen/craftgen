import { DiscordLogoIcon } from "@radix-ui/react-icons";
import { pageTree } from "../../source";
import { DocsLayout } from "fumadocs-ui/layout";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function RootDocsLayout({ children }: { children: ReactNode }) {
  return (
    <DocsLayout
      tree={pageTree}
      sidebar={{
        banner: (
          <div className="flex flex-col w-full">
            <Link href="/discord">
              <Button variant={"outline"} className="w-full">
                <DiscordLogoIcon className="mr-4" />
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
