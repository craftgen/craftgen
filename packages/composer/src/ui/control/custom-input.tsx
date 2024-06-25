import { useCallback } from "react";
import { useSelector } from "@xstate/react";

import type { InputControl } from "@craftgen/core/controls/input.control";
import { Input } from "@craftgen/ui/components/input";

import { ChangeFormat } from "./shared/change-format";
import { SecretDropdown } from "./shared/secret-dropdown";

export function CustomInput(props: { data: InputControl }) {
  const { definition, value: valueActor } = useSelector(
    props.data?.actor,
    (snap) => snap.context,
  );

  const value = useSelector(valueActor, (snap) => snap.context.value);

  const handledChange = useCallback((val: string) => {
    props.data.actor.send({
      type: "SET_VALUE",
      params: {
        value: val,
      },
    });
  }, []);

  return (
    <>
      <div className="flex w-full items-center justify-between">
        <SecretDropdown
          onSelect={(val) => {
            props.data.actor.send({
              type: "UPDATE_SOCKET",
              params: {
                format: "expression",
              },
            });
            handledChange(val);
          }}
        />
        <ChangeFormat value={value} actor={props.data.actor} />
      </div>
      <Input
        value={value}
        onChange={(e) => {
          handledChange(e.target.value);
        }}
        disabled={definition.readonly}
      />
    </>
  );
}
