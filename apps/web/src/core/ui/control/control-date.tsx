import { useEffect, useState } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

import { DateControl } from "@seocraft/core/src/controls/date";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export const DateControlComponent = (props: { data: DateControl }) => {
  const [date, setDate] = useState<Date | undefined>();
  const handleChange = (value: Date | undefined) => {
    setDate(value);
    props.data.setValue(value ?? null);
  };

  useEffect(() => {
    setDate(props.data.value ?? undefined);
  }, [props.data.value]);

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
            {date ? format(date, "PPP") : <span>Pick a date</span>}
          </Button>
        </PopoverTrigger>
        <p className={cn("text-muted-foreground text-[0.8rem]")}>
          {props.data?.definition?.description}
        </p>
      </div>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleChange}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
};
