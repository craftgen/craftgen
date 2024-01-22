import { useCallback } from "react";
import { javascript } from "@codemirror/lang-javascript";
import {
  Decoration,
  DecorationSet,
  EditorView,
  MatchDecorator,
  ViewPlugin,
  ViewUpdate,
} from "@codemirror/view";
import CodeMirror, { WidgetType } from "@uiw/react-codemirror";
import { useSelector } from "@xstate/react";
import { useTheme } from "next-themes";

import type { InputControl } from "@seocraft/core/src/controls/input.control";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

class PlaceholderWidget extends WidgetType {
  constructor(readonly value: string = "") {
    super();
  }

  eq(other: PlaceholderWidget) {
    return other.value == this.value;
  }

  toDOM() {
    let wrap = document.createElement("span");
    wrap.setAttribute("aria-hidden", "true");
    wrap.className = "p-1 rounded bg-primary text-primary-foreground";
    wrap.innerText = this.value;
    return wrap;
  }

  ignoreEvent() {
    return false;
  }
}

const placeholderMatcher = new MatchDecorator({
  regexp: /\(?await\s+getSecret\("(.+?)"\)\)?/g,
  decoration: (match) =>
    Decoration.replace({
      widget: new PlaceholderWidget(match[1]),
    }),
});

const placeholders = ViewPlugin.fromClass(
  class {
    placeholders: DecorationSet;
    constructor(view: EditorView) {
      this.placeholders = placeholderMatcher.createDeco(view);
    }
    update(update: ViewUpdate) {
      this.placeholders = placeholderMatcher.updateDeco(
        update,
        this.placeholders,
      );
    }
  },
  {
    decorations: (instance) => instance.placeholders,
    provide: (plugin) =>
      EditorView.atomicRanges.of((view) => {
        return view.plugin(plugin)?.placeholders || Decoration.none;
      }),
  },
);

export function CustomInput(props: { data: InputControl }) {
  const value = useSelector(props.data?.actor, props.data.selector);
  const { theme } = useTheme();
  const parseValue = useCallback((val: string) => {
    const secret = /^\(?await getSecret\("([^"]+)"\)\)?$/;
    const expression = /^ctx\["root"\](?:\["[^"]+"\])+$/;

    if (secret.test(val)) {
      const key = val?.match(secret)[1];
      if (!key) return val;
      return {
        secretKey: key,
      };
    } else if (expression.test(val)) {
      return {
        expression: val,
      };
    }
    return val;
  }, []);

  return (
    <div className="space-y-1">
      <Label htmlFor={props.data.id}>
        {props.data?.definition?.title || props.data?.definition?.name}
      </Label>
      {/* <div>
        <small className="text-muted-foreground">cred.</small>
        {["secret1", "secret2"].map((secret) => (
          <Button
            onClick={() =>
              props.data.setValue(`${value}(await getSecret("${secret}"))`)
            }
          >
            AddSecret
          </Button>
        ))}
      </div> */}
      <Input
        id={props.data.id}
        disabled={props.data.options.readonly}
        value={value}
        className="w-full max-w-md"
        onChange={(e) => {
          props.data.setValue(e.target.value);
        }}
      />
      {/* <CodeMirror
        value={value}
        theme={theme === "dark" ? "dark" : "light"}
        extensions={[
          javascript({
            jsx: false,
          }),
          placeholders,
        ]}
        className="p-1"
        basicSetup={{
          lineNumbers: false,
          autocompletion: true,
        }}
        onChange={(val, viewUpdate) => {
          console.log(parseValue(val));
          props.data.setValue(val);
        }}
      /> */}
      <p className={cn("text-muted-foreground text-[0.8rem]")}>
        {props.data?.definition?.description}
      </p>
    </div>
  );
}
