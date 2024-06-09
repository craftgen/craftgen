import { useSelector } from "@xstate/react";
import { format, parseISO } from "date-fns";
import { CalendarIcon } from "lucide-react";

import { DateControl } from "@seocraft/core/src/controls/date";

import { Button } from "@craftgen/ui/button";
import { Calendar } from "@craftgen/ui/calendar";
import { Label } from "@craftgen/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@craftgen/ui/popover";
import { cn } from "@/lib/utils";

export const DateControlComponent = (props: { data: DateControl }) => {
  const date = useSelector(props.data?.actor, props.data.selector);
  const handleChange = (value: Date | undefined) => {
    props.data.setValue(value ?? null);
  };

  return (
    <Popover>
      <div className="flex w-full flex-col space-y-1">
        <Label htmlFor={props.data.id}>
          {props.data?.definition?.title || props.data?.definition?.name}{" "}
        </Label>
        <PopoverTrigger asChild>
          <Button
            id={props.data.id}
            variant={"outline"}
            className={cn(
              "w-full max-w-md justify-start text-left font-normal",
              !date && "text-muted-foreground",
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(new Date(date), "PPP") : <span>Pick a date</span>}
          </Button>
        </PopoverTrigger>
        <p className={cn("text-muted-foreground text-[0.8rem]")}>
          {props.data?.definition?.description}
        </p>
      </div>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={parseISO(date)}
          onSelect={handleChange}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
};
