import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@craftgen/ui/select";
import { JSONSocket } from "@seocraft/core/src/controls/socket-generator";
import { inputSocketMachine } from "@seocraft/core/src/input-socket";
import { useSelector } from "@xstate/react";
import { useMemo } from "react";
import { ActorRefFrom, AnyActorRef, SnapshotFrom } from "xstate";

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
  T extends ActorRefFrom<typeof inputSocketMachine> = ActorRefFrom<
    typeof inputSocketMachine
  >,
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
      <SelectTrigger className="hover:text-foreground text-muted-foreground hover:border-1 max-w-fit  border-none py-1 text-sm shadow-none">
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
