import { useMemo, useState } from "react";
import { CaretSortIcon } from "@radix-ui/react-icons";
import { useSelector } from "@xstate/react";
import { CheckIcon } from "lucide-react";

import { ComboboxControl } from "@seocraft/core/src/controls/combobox";

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
import { ControlContainer } from "../control-container";

export function ComboboxControlComponent(props: { data: ComboboxControl }) {
  const { definition, parent } = useSelector(
    props.data?.actor,
    (snap) => snap.context,
  );
  const value = useSelector(
    props.data?.actor.system.get(parent.id),
    (snap) => snap.context.inputs[definition["x-key"]],
  );
  const [open, setOpen] = useState(false);
  const values = useMemo(() => {
    return definition?.allOf?.[0]?.enum?.map((v: any) => {
      return {
        key: v,
        value: v,
      };
    });
  }, [definition]);
  const handleChange = (val: string) => {
    props.data.actor.send({
      type: "SET_VALUE",
      params: {
        value: val,
      },
    });
  };
  return (
    <ControlContainer id={props.data.id} definition={props.data.definition}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {value
              ? values.find((entry) => entry.key === value)?.value
              : "Select framework..."}
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
              {values.map((entry) => (
                <CommandItem
                  key={entry.key}
                  value={entry.key}
                  onSelect={(currentValue) => {
                    handleChange(currentValue === value ? "" : currentValue);
                    setOpen(false);
                  }}
                >
                  {entry.value}
                  <CheckIcon
                    className={cn(
                      "ml-auto h-4 w-4",
                      value === entry.key ? "opacity-100" : "opacity-0",
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    </ControlContainer>
  );
}
