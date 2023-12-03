import { useSelector } from "@xstate/react";

import type { TextareControl } from "@seocraft/core/src/controls/textarea";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export function CustomTextarea(props: { data: TextareControl }) {
  const value = useSelector(props.data?.actor, props.data.selector);

  return (
    <div className="space-y-1">
      <Label htmlFor={props.data.id}>
        {props.data?.definition?.title || props.data?.definition?.name}
      </Label>
      <Textarea
        id={props.data.id}
        disabled={props.data.options.readonly}
        rows={3}
        value={value}
        className="resize-none hover:resize"
        onChange={(e) => {
          props.data.setValue(e.target.value);
        }}
      />
      <p className={cn("text-muted-foreground text-[0.8rem]")}>
        {props.data?.definition?.description}
      </p>
    </div>
  );
}
