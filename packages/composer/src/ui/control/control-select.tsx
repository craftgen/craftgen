import { useMemo } from "react";
import { useSelector } from "@xstate/react";

import { SelectControl } from "@craftgen/core/controls/select";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@craftgen/ui/components/select";

export function SelectControlComponent(props: { data: SelectControl }) {
  const { definition, value: valueActor } = useSelector(
    props.data?.actor,
    (snap) => snap.context,
  );

  const value = useSelector(valueActor, (snap) => snap.context.value);

  const values = useMemo(() => {
    return definition?.allOf?.[0]?.enum?.map((v: any) => {
      return {
        key: v,
        value: v,
      };
    });
  }, [definition]);

  const handleChange = (value: any) => {
    props.data.actor.send({
      type: "SET_VALUE",
      params: {
        value,
      },
    });
  };

  return (
    <Select value={value} onValueChange={handleChange} defaultValue={value}>
      <SelectTrigger className="w-full min-w-[5rem]" id={props.data.id}>
        <SelectValue
          id={props.data.id}
          placeholder={definition.title || definition.description}
          className="w-full max-w-md truncate"
        />
      </SelectTrigger>
      <SelectContent className="z-50">
        {values.map((value) => (
          <SelectItem key={value.key} value={value.key}>
            {value.value}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
