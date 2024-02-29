import { useCallback } from "react";

import { useSelector } from "@xstate/react";

import type { InputControl } from "@seocraft/core/src/controls/input.control";

import { ControlContainer } from "../control-container";
import { Input } from "@/components/ui/input";
import { ChangeFormat } from "./shared/change-format";
import { SecretDropdown } from "./shared/secret-dropdown";

export function CustomInput(props: { data: InputControl }) {
  const { definition, parent } = useSelector(
    props.data?.actor,
    (snap) => snap.context,
  );
  const value = useSelector(
    props.data?.actor.system.get(parent.id),
    (snap) => snap.context.inputs[definition["x-key"]],
  );

  const handledChange = useCallback((val: string) => {
    props.data.actor.send({
      type: "SET_VALUE",
      params: {
        value: val,
      },
    });
  }, []);

  return (
    <ControlContainer id={props.data.id} definition={props.data.definition}>
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
    </ControlContainer>
  );
}
