import { useSelector } from "@xstate/react";

import type { BooleanControl } from "@seocraft/core/src/controls/boolean";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

export const BooleanControlComponent = (props: { data: BooleanControl }) => {
  const { definition, parent } = useSelector(
    props.data?.actor,
    (snap) => snap.context,
  );
  const value = useSelector(
    props.data?.actor.system.get(parent.id),
    (snap) => snap.context.inputs[definition["x-key"]],
  );

  const handleChange = (value: boolean) => {
    props.data.actor.send({
      type: "SET_VALUE",
      params: {
        value,
      },
    });
  };

  return (
    <div className="flex flex-col items-start space-y-0.5 ">
      <div className="flex items-center">
        <Label htmlFor={props.data.id}>
          {props.data?.definition?.title || props.data?.definition?.name}
        </Label>
        <Switch
          checked={value}
          onCheckedChange={handleChange}
          className="ml-4"
        />
      </div>
      <p className={cn("text-muted-foreground text-[0.8rem]")}>
        {props.data?.definition?.description}
      </p>
    </div>
  );
};
