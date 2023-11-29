import { useEffect, useState } from "react";

import type { TextareControl } from "@seocraft/core/src/controls/textarea";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export function CustomTextarea(props: { data: TextareControl }) {
  const [value, setValue] = useState(props.data.value);

  useEffect(() => {
    setValue(props.data.value);
  }, [props.data.value]);

  return (
    <div className="space-y-1">
      <Label htmlFor={props.data.id}>
        {props.data?.defination?.title || props.data?.defination?.name}
      </Label>
      <Textarea
        id={props.data.id}
        disabled={props.data.options.readonly}
        rows={3}
        value={value}
        className="resize-none hover:resize"
        onChange={(e) => {
          setValue(e.target.value);
          props.data.setValue(e.target.value);
        }}
      />
      <p className={cn("text-muted-foreground text-[0.8rem]")}>
        {props.data?.defination?.description}
      </p>
    </div>
  );
}
