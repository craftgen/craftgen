import { useMemo, useState } from "react";
import { CaretSortIcon } from "@radix-ui/react-icons";
import { useSelector } from "@xstate/react";
import { CheckIcon } from "lucide-react";

import { SecretController } from "@seocraft/core/src/controls/secret";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";
import { ChangeFormat } from "./shared/change-format";

export function SecretControlComponent(props: { data: SecretController }) {
  const { definition, value: valueActor } = useSelector(
    props.data?.actor,
    (snap) => snap.context,
  );

  const value = useSelector(valueActor, (snap) => snap.context.value);
  const [open, setOpen] = useState(false);
  const { data: values } = api.credentials.list.useQuery(
    {},
    {
      initialData: [],
    },
  );
  const handleChange = (val: string) => {
    props.data.actor.send({
      type: "SET_VALUE",
      params: {
        value: val,
      },
    });
  };
  return (
    <>
      <div className="flex w-full items-center justify-end">
        <ChangeFormat value={value} actor={props.data.actor} />
      </div>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {value
              ? values && values.find((entry) => entry.key === value)?.key
              : "Select Secret"}
            <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0">
          <Command>
            <CommandInput
              placeholder={definition.title || definition.description}
              className="h-9"
            />
            <CommandEmpty>No {props.data.definition.name} found.</CommandEmpty>
            <CommandGroup>
              {values &&
                values.map((entry) => (
                  <CommandItem
                    key={entry.key}
                    value={entry.key}
                    onSelect={(currentValue) => {
                      handleChange(currentValue === value ? "" : currentValue);
                      setOpen(false);
                    }}
                  >
                    {entry.key}
                    <CheckIcon
                      className={cn(
                        "ml-auto h-4 w-4",
                        value === entry.value ? "opacity-100" : "opacity-0",
                      )}
                    />
                  </CommandItem>
                ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    </>
  );
}
