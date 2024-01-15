import { javascript } from "@codemirror/lang-javascript";
import CodeMirror from "@uiw/react-codemirror";
import { useSelector } from "@xstate/react";

import type { InputControl } from "@seocraft/core/src/controls/input.control";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function CustomInput(props: { data: InputControl }) {
  const value = useSelector(props.data?.actor, props.data.selector);

  return (
    <div className="space-y-1">
      <Label htmlFor={props.data.id}>
        {props.data?.definition?.title || props.data?.definition?.name}
      </Label>
      <div>
        <small className="text-muted-foreground">cred.</small>
      </div>
      <CodeMirror
        value={value}
        height="200px"
        extensions={[
          javascript({
            jsx: false,
          }),
        ]}
        onChange={(val, viewUpdate) => {
          props.data.setValue(val);
        }}
      />
      <Input
        id={props.data.id}
        disabled={props.data.options.readonly}
        value={value}
        className="w-full max-w-md"
        onChange={(e) => {
          props.data.setValue(e.target.value);
        }}
      />
      <p className={cn("text-muted-foreground text-[0.8rem]")}>
        {props.data?.definition?.description}
      </p>
    </div>
  );
}
