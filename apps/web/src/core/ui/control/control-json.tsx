import { useEffect, useState } from "react";
import { useSelector } from "@xstate/react";
import JsonView from "react18-json-view";

import { JsonControl } from "@seocraft/core/src/controls/json";

export const JsonControlComponent = (props: { data: JsonControl }) => {
  const { value: valueActor } = useSelector(
    props.data?.actor,
    (snap) => snap.context,
  );

  const a = useSelector(valueActor, (snap) => snap.context.value);
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
      <JsonView
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
