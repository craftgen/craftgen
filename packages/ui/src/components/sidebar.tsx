import { Icons } from "./icons";
import { Separator } from "./separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip";

export const Sidebar = <T extends React.ComponentType<any>>({
  Link,
  topLinks = [],
  bottomLinks = [],
  logoLinkProps,
}: {
  Link: T;
  logoLinkProps?: React.ComponentProps<T>;
  bottomLinks: {
    label: string;
    icon: React.ReactNode;
    linkProps?: React.ComponentProps<T>;
  }[];
  topLinks: {
    label: string;
    icon: React.ReactNode;
    linkProps?: React.ComponentProps<T>;
  }[];
}) => {
  return (
    <aside className="fixed inset-y-0 left-0 z-10 hidden w-14 flex-col border-r bg-background sm:flex">
      <nav className="flex flex-col items-center gap-4 px-2 sm:py-4">
        <Link
          {...(logoLinkProps as any)}
          className="group flex h-9 w-9 shrink-0 items-center justify-center gap-2  text-lg font-semibold text-primary-foreground md:h-8 md:w-8 md:text-base "
        >
          <Icons.logo className="h-8 w-8 transition-all group-hover:opacity-90" />
          <span className="sr-only">CraftGen</span>
        </Link>

        <Separator />

        {topLinks.map((link, index) => (
          <Tooltip key={index}>
            <TooltipTrigger asChild>
              <Link
                {...(link.linkProps as any)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8"
              >
                {link.icon}
                <span className="sr-only">{link.label}</span>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right">{link.label}</TooltipContent>
          </Tooltip>
        ))}
      </nav>

      <nav className="mt-auto flex flex-col items-center gap-4 px-2 sm:py-4">
        {bottomLinks.map((link, index) => (
          <Tooltip key={index}>
            <TooltipTrigger asChild>
              <Link
                {...(link.linkProps as any)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8"
              >
                {link.icon}
                <span className="sr-only">{link.label}</span>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right">{link.label}</TooltipContent>
          </Tooltip>
        ))}
      </nav>
    </aside>
  );
};
