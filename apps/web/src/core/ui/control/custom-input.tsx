import { useCallback, useState } from "react";
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
import { githubDark, githubLight } from "@uiw/codemirror-theme-github";

import { useSelector } from "@xstate/react";
import { useTheme } from "next-themes";

import type { InputControl } from "@seocraft/core/src/controls/input.control";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { api } from "@/trpc/react";
import { Icons } from "@/components/icons";

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
  const { data: creds } = api.credentials.list.useQuery({
    projectId: "9ad65390-e82b-42b2-9cae-a62dce62011e",
  });
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-1">
      <div className="flex w-full items-center justify-between">
        <Label htmlFor={props.data.id}>
          {props.data?.definition?.title || props.data?.definition?.name}
        </Label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="justify-start" size="sm">
              <Icons.key className="mr-2 h-4 w-4" />
              Secret
            </Button>
          </PopoverTrigger>
          <PopoverContent className="p-0" side="right" align="start">
            <Command>
              <CommandInput placeholder="Search Secret" />
              <CommandList>
                <CommandEmpty>No results found.</CommandEmpty>
                <CommandGroup>
                  {creds?.map((cred) => (
                    <CommandItem
                      key={cred.key}
                      value={cred.key}
                      onSelect={(value) => {
                        console.log(value);
                        props.data.setValue(`(await getSecret("${value}"))`);
                        setOpen(false);
                      }}
                    >
                      {cred.key}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
      <CodeMirror
        id={props.data.id}
        readOnly={props.data.options.readonly}
        value={value}
        theme={theme === "dark" ? githubDark : githubLight}
        extensions={[
          javascript({
            jsx: false,
          }),
          placeholders,
        ]}
        className="bg-muted/30 w-full rounded-lg p-2 outline-none"
        width="100%"
        height="100%"
        basicSetup={{
          lineNumbers: false,
          autocompletion: true,
          foldGutter: false,
        }}
        onChange={(val, viewUpdate) => {
          console.log(parseValue(val));
          props.data.setValue(val);
        }}
      />
      <p className={cn("text-muted-foreground text-[0.8rem]")}>
        {props.data?.definition?.description}
      </p>
    </div>
  );
}
