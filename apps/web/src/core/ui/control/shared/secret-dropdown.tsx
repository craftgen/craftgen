import { useUser } from "@/app/(dashboard)/hooks/use-user";
import { Icons } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { api } from "@/trpc/react";
import { useState } from "react";

export const SecretDropdown = (props: { onSelect: (val: string) => void }) => {
  const { data: user } = useUser();
  const { data: creds } = api.credentials.list.useQuery(
    {},
    {
      enabled: !!user,
      initialData: [],
    },
  );
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className="justify-start"
          size="sm"
          disabled={!user}
        >
          <Icons.key className="mr-2 h-4 w-4" />
          <p className="text-muted-foreground text-xs">Secret</p>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0" side="right" align="start">
        <Command>
          <CommandInput placeholder="Search Secret" />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              {creds?.map((cred) => (
                <CommandItem
                  key={cred.id}
                  value={cred.key}
                  onSelect={(value) => {
                    props.onSelect(`(await getSecret("${value}"))`);
                    setOpen(false);
                  }}
                >
                  <div className="flex w-full items-center justify-between">
                    {cred.key}
                    {cred.default && (
                      <Badge className="ml-2 bg-green-400/80">Default</Badge>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
