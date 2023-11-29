import JsonView from "react18-json-view";

import { JsonControl } from "@seocraft/core/src/controls/json";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export const JsonControlComponent = (props: { data: JsonControl }) => {
  return (
    <div className="space-y-1">
      <Label htmlFor={props.data.id}>
        {props.data?.definition?.title || props.data?.definition?.name}
      </Label>
      <JsonView src={props.data.value} editable collapsed={2} />
      <p className={cn("text-muted-foreground text-[0.8rem]")}>
        {props.data?.definition?.description}
      </p>
    </div>
  );
};
