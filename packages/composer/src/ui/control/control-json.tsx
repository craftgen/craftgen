import { useEffect, useState } from "react";
import { useSelector } from "@xstate/react";

import { JsonControl } from "@craftgen/core/controls/json";
import { JSONView } from "@craftgen/ui/components/json-view";

export const JsonControlComponent = (props: { data: JsonControl }) => {
  const { value: valueActor } = useSelector(
    props.data?.actor,
    (snap) => snap.context,
  );

  const a = useSelector(valueActor, (snap) => snap?.context?.value);
  const [value, setValue] = useState(a);

  useEffect(() => {
    setValue(a);
  }, [a]);

  const handleChange = (val: { src: any }) => {
    console.log(val.src);
    setValue(val.src);
    props.data.actor.send({
      type: "SET_VALUE",
      params: {
        value: val,
      },
    });
  };
  return (
    <div className="space-y-1">
      <JSONView
        src={value}
        editable
        collapsed={2}
        onAdd={handleChange}
        onDelete={handleChange}
        onEdit={handleChange}
      />
    </div>
  );
};
