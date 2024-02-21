import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { JSONSocket } from "@seocraft/core/src/controls/socket-generator";
import { useSelector } from "@xstate/react";
import { useMemo } from "react";
import { AnyActorRef, SnapshotFrom } from "xstate";

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

export const ChangeFormat = <T extends AnyActorRef = AnyActorRef>(props: {
  value: string;
  actor: T;
  selector: (snapshot: SnapshotFrom<T> | undefined) => JSONSocket;
}) => {
  const definition = useSelector(props.actor, props.selector);
  const format = useMemo(() => parseValueFN(props.value), [props.value]);

  return (
    <Select
      value={definition.format || "text"}
      onValueChange={(val) => {
        props.actor.send({
          type: "UPDATE_SOCKET",
          params: {
            name: definition["x-key"],
            side: "input",
            socket: {
              format: val === "text" ? undefined : val,
            },
          },
        });
      }}
    >
      <SelectTrigger className="w-10 min-w-fit">
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
