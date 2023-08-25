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
import {
  CaretSortIcon,
  CheckIcon,
  PlusCircledIcon,
} from "@radix-ui/react-icons";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PopoverTriggerProps } from "@radix-ui/react-popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import useSWR from "swr";
import { useParams, useRouter } from "next/navigation";
import { getProjects } from "../dashboard/actions";
import { useMemo, useState } from "react";
import { NewProjectForm } from "../project/new/new-project-form";

interface TeamSwitcherProps extends PopoverTriggerProps {}

const groups = [
  {
    label: "Projects",
    teams: [
      {
        label: "Acme Inc.",
        value: "acme-inc",
      },
      {
        label: "Monsters Inc.",
        value: "monsters",
      },
    ],
  },
];
type Team = (typeof groups)[number]["teams"][number];

export const TeamSwitcher = ({ className }: TeamSwitcherProps) => {
  const { data, isLoading } = useSWR("projects", getProjects);
  const params = useParams();
  const router = useRouter();
  const handleChange = (value: string) => {
    if (value !== params.projectSlug) {
      router.push(`/project/${value}`);
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
    return [
      {
        label: "Projects",
        teams:
          data?.map((project) => ({
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
    return groups[0].teams.find(
      (team) => team.value === params.projectSlug
    ) as Team;
  }, [params.projectSlug, groups]);

  return (
    <Dialog open={showNewTeamDialog} onOpenChange={setShowNewTeamDialog}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            role="combobox"
            aria-expanded={open}
            aria-label="Select a team"
            className={cn("w-[280px] justify-between", className)}
          >
            <Avatar className="mr-2 h-5 w-5">
              <AvatarImage
                src={`https://avatar.vercel.sh/${selectedTeam.value}.png`}
                alt={selectedTeam.label}
              />
              <AvatarFallback>SC</AvatarFallback>
            </Avatar>
            {selectedTeam.label}
            <CaretSortIcon className="ml-auto h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[280px] p-0">
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
                          className="grayscale"
                        />
                        <AvatarFallback>SC</AvatarFallback>
                      </Avatar>
                      {team.label}
                      <CheckIcon
                        className={cn(
                          "ml-auto h-4 w-4",
                          selectedTeam.value === team.value
                            ? "opacity-100"
                            : "opacity-0"
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
