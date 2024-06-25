import { useMemo } from "react";
import { useSelector } from "@xstate/react";

import { InputSocketMachineActor } from "@craftgen/core/input-socket";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@craftgen/ui/components/select";

function parseValueFN(value: string) {
  const secret = /^\(?await getSecret\("([^"]+)"\)\)?$/;
  const expression = /^ctx\["root"\](?:\["[^"]+"\])+$/;

  if (secret.test(value)) {
    const key = value?.match(secret)?.[1];
    if (!key) return value;
    // return { secretKey: key };
    return "secret";
  }

  if (expression.test(value)) {
    // return { expression: value };
    return "expression";
  }

  return "text";
}

export const ChangeFormat = <
  T extends InputSocketMachineActor = InputSocketMachineActor,
>(props: {
  value: string;
  actor: T;
}) => {
  const definition = useSelector(
    props.actor,
    (snap) => snap.context.definition,
  );
  const format = useMemo(() => parseValueFN(props.value), [props.value]);

  return (
    <Select
      value={definition?.format || "text"}
      onValueChange={(val) => {
        props.actor.send({
          type: "UPDATE_SOCKET",
          params: {
            format: val === "text" ? undefined : val,
          },
        });
      }}
    >
      <SelectTrigger className="hover:border-1 max-w-fit border-none py-1  text-sm text-muted-foreground shadow-none hover:text-foreground">
        <SelectValue placeholder="type" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem
          value="text"
          disabled={["secret", "expression"].includes(format)}
        >
          Text
        </SelectItem>
        <SelectItem value="expression">Expression</SelectItem>
        <SelectItem value="secret">Variable</SelectItem>
      </SelectContent>
    </Select>
  );
};
