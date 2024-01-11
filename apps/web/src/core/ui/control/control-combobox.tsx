import { useState } from "react";
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
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export function ComboboxControlComponent(props: {
  data: ComboboxControl<any, any>;
}) {
  const value = useSelector(props.data.actor, props.data.selector);
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-1">
      <Label htmlFor={props.data.id}>
        {props.data?.definition?.title || props.data?.definition?.name}
      </Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {value
              ? props.data.options.values.find(
                  (framework) => framework.key === value,
                )?.value
              : "Select framework..."}
            <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0">
          <Command>
            <CommandInput
              placeholder={props.data.options.placeholder}
              className="h-9"
            />
            <CommandEmpty>No {props.data.definition.name} found.</CommandEmpty>
            <CommandGroup>
              {props.data.options.values.map((framework) => (
                <CommandItem
                  key={framework.key}
                  value={framework.key}
                  onSelect={(currentValue) => {
                    props.data.setValue(
                      currentValue === value ? "" : currentValue,
                    );
                    setOpen(false);
                  }}
                >
                  {framework.value}
                  <CheckIcon
                    className={cn(
                      "ml-auto h-4 w-4",
                      value === framework.key ? "opacity-100" : "opacity-0",
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
      <p className={cn("text-muted-foreground text-[0.8rem]")}>
        {props.data?.definition?.description}
      </p>
    </div>
  );
}
