import { useState } from "react";

import { Badge } from "@craftgen/ui/components/badge";
import { Button } from "@craftgen/ui/components/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@craftgen/ui/components/command";
import { Icons } from "@craftgen/ui/components/icons";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@craftgen/ui/components/popover";
import { api } from "@craftgen/ui/lib/api";

export const SecretDropdown = (props: { onSelect: (val: string) => void }) => {
  const { data: user } = api.auth.getSession.useQuery();
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
          <p className="text-xs text-muted-foreground">Secret</p>
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
