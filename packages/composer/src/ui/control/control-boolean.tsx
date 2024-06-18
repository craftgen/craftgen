import { useSelector } from "@xstate/react";

import type { BooleanControl } from "@craftgen/core/controls/boolean";
import { Switch } from "@craftgen/ui/components/switch";

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
        <Switch checked={value} onCheckedChange={handleChange} />
      </div>
    </div>
  );
};
