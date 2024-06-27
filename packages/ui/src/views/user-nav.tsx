"use client";

import { useMemo } from "react";
import { useTheme } from "next-themes";
import { usePostHog } from "posthog-js/react";
import { useHotkeys } from "react-hotkeys-hook";
import { Key } from "ts-key-enum";

import { Avatar, AvatarFallback, AvatarImage } from "../components/avatar";
import { Button } from "../components/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "../components/dropdown-menu";
import { api } from "../lib/api";

export const UserNav: React.FC<{
  Link: any;
  handleLogout: () => Promise<void>;
}> = ({ handleLogout }) => {
  const { data: user } = api.auth.getSession.useQuery();
  const posthog = usePostHog();
  const avatarFallbackInitials = useMemo(() => {
    if (!user) return "S";
    const [firstName, lastName] = (user?.fullName || "S C").split(" ") as [
      string,
      string,
    ];
    return `${firstName[0]}${lastName[0]}`;
  }, [user?.fullName]);
  // const router = useRouter();

  const handleProfileClick = () => {
    // router.push(`/${user?.username}`);
  };

  const handleBillingClick = () => {
    // router.push(`/billing`);
  };
  // const supabase = createClientComponentClient();

  const onLogout = async () => {
    // await supabase.auth.signOut();
    posthog.reset();
    await handleLogout();
    // router.push("/");
  };
  useHotkeys(`${Key.Meta}+${Key.Shift}+q`, onLogout);

  useHotkeys(`${Key.Meta}+${Key.Shift}+p`, handleProfileClick);
  const { setTheme, theme } = useTheme();
  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            {user.avatar_url && (
              <AvatarImage
                src={user?.avatar_url}
                alt={user?.fullName || "craftgen user"}
              />
            )}
            <AvatarFallback>{avatarFallbackInitials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              @{user?.username}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user?.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onSelect={handleProfileClick}>
            Profile
            <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={handleBillingClick}>
            Billing
            <DropdownMenuShortcut>⌘B</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem>
            Settings
            <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem>New Team</DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <span>Toggle theme</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                <DropdownMenuCheckboxItem
                  checked={theme === "light"}
                  onCheckedChange={() => setTheme("light")}
                >
                  Light
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={theme === "dark"}
                  onCheckedChange={() => setTheme("dark")}
                >
                  Dark
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={theme === "system"}
                  onCheckedChange={() => setTheme("system")}
                >
                  System
                </DropdownMenuCheckboxItem>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={onLogout}>
          Log out
          <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
