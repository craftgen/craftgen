import { useCallback, useEffect, useRef, useState } from "react";

import { useSelector } from "@xstate/react";
import { useTheme } from "next-themes";
import CodeMirror from "codemirror";

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
import { P, match } from "ts-pattern";
import { Key } from "lucide-react";
import { Badge } from "@/components/ui/badge";

import ecma from "@seocraft/core/src/worker/autocomplete/definitions/ecmascript.json";
import lodash from "@seocraft/core/src/worker/autocomplete/definitions/lodash.json";
import base64 from "@seocraft/core/src/worker/autocomplete/definitions/base64-js.json";
import moment from "@seocraft/core/src/worker/autocomplete/definitions/moment.json";
import forge from "@seocraft/core/src/worker/autocomplete/definitions/forge.json";

import "codemirror/lib/codemirror.css";
import "codemirror/addon/tern/tern.css";
import "codemirror/addon/hint/show-hint.css";
import "codemirror/addon/lint/lint.css";
import "codemirror/theme/oceanic-next.css";
import "codemirror/theme/juejin.css";

export function CustomInput(props: { data: InputControl }) {
  const value = useSelector(props.data?.actor, props.data.selector);
  const { systemTheme } = useTheme();
  const parseValue = useCallback((val: string) => {
    const secret = /^\(?await getSecret\("([^"]+)"\)\)?$/;
    const expression = /^ctx\["root"\](?:\["[^"]+"\])+$/;

    if (secret.test(val)) {
      const key = val?.match(secret)?.[1];
      if (!key) return val;
      return { secretKey: key };
    }

    if (expression.test(val)) {
      return { expression: val };
    }

    return val;
  }, []);

  const handledChange = (val: string) => {
    console.log("##", val);
    const res = parseValue(val);
    console.log("RRR", res);

    match(res)
      .with({ expression: P.string }, () => {
        props.data.actor.send({
          type: "UPDATE_SOCKET",
          params: {
            name: props.data.definition["x-key"],
            side: "input",
            socket: {
              format: "expression",
            },
          },
        });
      })
      .with({ secretKey: P.string }, () => {
        props.data.actor.send({
          type: "UPDATE_SOCKET",
          params: {
            name: props.data.definition["x-key"],
            side: "input",
            socket: {
              format: "secret",
            },
          },
        });
      })
      .otherwise(() => {
        props.data.actor.send({
          type: "UPDATE_SOCKET",
          params: {
            name: props.data.definition["x-key"],
            side: "input",
            socket: {
              format: undefined,
            },
          },
        });
      });
    props.data.setValue(val);
  };

  const [open, setOpen] = useState(false);
  const { data: creds } = api.credentials.list.useQuery({
    projectId: "9ad65390-e82b-42b2-9cae-a62dce62011e",
  });

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
                      key={cred.id}
                      value={cred.key}
                      onSelect={(value) => {
                        console.log(value);
                        handledChange(`(await getSecret("${value}"))`);
                        setOpen(false);
                      }}
                    >
                      <div className="flex w-full items-center justify-between">
                        {cred.key}
                        {cred.default && (
                          <Badge className="ml-2 bg-green-400/80">
                            Default
                          </Badge>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      <Editor
        value={value}
        onValueChange={(v) => handledChange(v)}
        readOnly={props.data.options.readonly}
        theme={systemTheme === "dark" ? "dark" : "light"}
      />

      <p className={cn("text-muted-foreground text-[0.8rem]")}>
        {props.data?.definition?.description}
      </p>
    </div>
  );
}

interface EditorProps {
  value: string;
  onValueChange: (value: string) => void;
  readOnly?: boolean;
  theme: "dark" | "light";
}

export function Editor(props: EditorProps) {
  const { value, onValueChange, readOnly, theme } = props;
  const tern = useRef<any | null>(null);

  const editorTarget = useRef<HTMLDivElement>(null);
  const editor = useRef<CodeMirror.Editor | null>(null);

  useEffect(() => {
    if (!editor.current) {
      return;
    }

    const theme_ = theme === "dark" ? "oceanic-next" : "juejin";
    editor.current.setOption("readOnly", readOnly);
    editor.current.setOption("theme", theme);
  }, [readOnly, theme]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (!editor.current) {
      const options = {
        tabSize: 2,
        autoCloseBrackets: true,
        indentWithTabs: false,
        lineWrapping: false,
        lineNumbers: false,
        matchBrackets: false,
        scrollbarStyle: "null",
        mode: "javascript",
        value: value,
      };

      require("codemirror");
      require("codemirror/addon/hint/show-hint");
      require("codemirror/addon/edit/matchbrackets");
      require("codemirror/addon/display/placeholder");
      require("codemirror/addon/edit/closebrackets");
      require("codemirror/addon/display/autorefresh");
      require("codemirror/addon/mode/multiplex");
      require("codemirror/addon/lint/lint");
      require("codemirror/addon/comment/comment");
      require("codemirror/mode/sql/sql.js");
      require("codemirror/addon/hint/show-hint");
      require("codemirror/addon/hint/sql-hint");
      require("codemirror/mode/css/css");
      require("codemirror/mode/javascript/javascript");
      require("codemirror/mode/htmlmixed/htmlmixed");
      const CodeMirror = require("codemirror");

      (window as any).tern = require("tern");
      require("tern/plugin/doc_comment");
      require("tern/plugin/complete_strings");
      require("codemirror/addon/tern/tern");

      const tern_ = new CodeMirror.TernServer({
        defs: [ecma, moment, lodash, base64, forge],
      });

      tern.current = tern_;
      editor.current = CodeMirror(editorTarget.current!, options);
      editor.current?.setOption("readOnly", readOnly);
      editor.current?.on("cursorActivity", (cm) => tern_.updateArgHints(cm));
      editor.current?.on("change", (instance, change) => {
        if (change.text.length === 1 && change.text[0] === ".") {
          tern_.complete(editor.current!);
        }

        const value = instance.getValue() || "";
        onValueChange(value);
      });
    }
  }, []);

  return (
    <div
      ref={editorTarget}
      className="bg-muted/30 w-full overflow-hidden rounded-lg outline-none"
    />
  );
}
