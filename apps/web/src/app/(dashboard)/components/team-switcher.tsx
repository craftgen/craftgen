"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  CaretSortIcon,
  CheckIcon,
  PlusCircledIcon,
} from "@radix-ui/react-icons";
import type { PopoverTriggerProps } from "@radix-ui/react-popover";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import useSWR from "swr";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";

import { getUserProjects } from "../explore/actions";
import { NewProjectForm } from "../project/new/new-project-form";

type TeamSwitcherProps = PopoverTriggerProps;

interface Team {
  label: string;
  value: string;
}

export const TeamSwitcher = ({ className }: TeamSwitcherProps) => {
  const { data, isLoading } = api.project.userProjects.useQuery();
  const params = useParams();
  const router = useRouter();
  const supabase = createClientComponentClient();

  const handleChange = async (value: string) => {
    if (value !== params.projectSlug) {
      await supabase.auth.updateUser({
        data: { currentProjectId: value },
      });
      router.push(`/${value}`);
    }
  };
  const [open, setOpen] = useState(false);
  const [showNewTeamDialog, setShowNewTeamDialog] = useState(false);
  const groups = useMemo(() => {
    if (isLoading) {
      return [
        {
          label: "Projects",
          teams: [
            {
              label: params.projectSlug as string,
              value: params.projectSlug as string,
            },
          ],
        },
      ];
    }
    const personalProject = data?.find((p) => p.project.personal);
    const projects = data?.filter((p) => !p.project.personal);
    return [
      {
        label: "Personal Account",
        teams: [
          {
            label: personalProject?.project.name || "Personal",
            value: personalProject?.project.slug || "personal",
          },
        ],
      },
      {
        label: "Projects",
        teams:
          projects?.map((project) => ({
            label: project.project.name,
            value: project.project.slug,
          })) || ([] as { label: string; value: string }[]),
      },
    ];
  }, [data]);
  const selectedTeam = useMemo(() => {
    if (!groups[0]?.teams) {
      return {
        label: params.projectSlug as string,
        value: params.projectSlug as string,
      };
    }
    const teams = groups.map((group) => group.teams).flat();
    const founedTeam = teams.find(
      (team) => team.value === params.projectSlug,
    ) as Team;
    if (!founedTeam) {
      return teams[0];
    }
    return founedTeam;
  }, [params.projectSlug, groups]);

  return (
    <Dialog open={showNewTeamDialog} onOpenChange={setShowNewTeamDialog}>
      <Popover open={open} onOpenChange={setOpen}>
        <Link href={`/${selectedTeam?.value}`} className="flex">
          <Avatar className="mr-2 h-5 w-5">
            <AvatarImage
              src={`https://avatar.vercel.sh/${selectedTeam?.value}.png`}
              alt={selectedTeam?.label}
            />
            <AvatarFallback>SC</AvatarFallback>
          </Avatar>
          {selectedTeam?.label}
        </Link>
        <Button
          variant="ghost"
          role="combobox"
          size="icon"
          aria-expanded={open}
          aria-label="Select a team"
          className={cn(className)}
        >
          <PopoverTrigger asChild>
            <CaretSortIcon className="h-4 w-4 shrink-0 px-0 opacity-50" />
          </PopoverTrigger>
        </Button>
        <PopoverContent className="w-[280px] min-w-[160px] p-0">
          <Command>
            <CommandList>
              <CommandInput placeholder="Search team..." />
              <CommandEmpty>No team found.</CommandEmpty>
              {groups.map((group) => (
                <CommandGroup key={group.label} heading={group.label}>
                  {group.teams.map((team) => (
                    <CommandItem
                      key={team.value}
                      onSelect={() => {
                        handleChange(team.value);
                        setOpen(false);
                      }}
                      className="text-sm"
                    >
                      <Avatar className="mr-2 h-5 w-5">
                        <AvatarImage
                          src={`https://avatar.vercel.sh/${team.value}.png`}
                          alt={team.label}
                          className=""
                        />
                        <AvatarFallback>SC</AvatarFallback>
                      </Avatar>
                      {team.label}
                      <CheckIcon
                        className={cn(
                          "ml-auto h-4 w-4",
                          selectedTeam?.value === team.value
                            ? "opacity-100"
                            : "opacity-0",
                        )}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))}
            </CommandList>
            <CommandSeparator />
            <CommandList>
              <CommandGroup>
                <DialogTrigger asChild>
                  <CommandItem
                    onSelect={() => {
                      setOpen(false);
                      setShowNewTeamDialog(true);
                    }}
                  >
                    <PlusCircledIcon className="mr-2 h-5 w-5" />
                    Create Project
                  </CommandItem>
                </DialogTrigger>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Project</DialogTitle>
          <DialogDescription>
            Add a new project to manage site and content.
          </DialogDescription>
        </DialogHeader>
        <NewProjectForm>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowNewTeamDialog(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Continue</Button>
          </DialogFooter>
        </NewProjectForm>
      </DialogContent>
    </Dialog>
  );
};
