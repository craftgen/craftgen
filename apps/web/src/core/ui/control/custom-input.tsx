import "./custom-input.css";
import _ from "lodash";
import { usePreviousDistinct } from "react-use";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { javascript, javascriptLanguage } from "@codemirror/lang-javascript";

// @ts-ignore
import jsdoc from "json-schema-to-jsdoc";

require("tern/plugin/doc_comment");
import tern from "tern";

import {
  Completion,
  CompletionContext,
  autocompletion,
  startCompletion,
} from "@codemirror/autocomplete";
import { indentWithTab } from "@codemirror/commands";

import {
  Decoration,
  DecorationSet,
  EditorView,
  MatchDecorator,
  ViewPlugin,
  ViewUpdate,
  keymap,
} from "@codemirror/view";
import { vscodeKeymap } from "@replit/codemirror-vscode-keymap";
import { indentationMarkers } from "@replit/codemirror-indentation-markers";

import CodeMirror, { WidgetType, useCodeMirror } from "@uiw/react-codemirror";
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
import { P, match } from "ts-pattern";
import { Badge } from "@/components/ui/badge";

import ecma from "@seocraft/core/src/worker/autocomplete/definitions/ecmascript.json";
import lodash from "@seocraft/core/src/worker/autocomplete/definitions/lodash.json";
import base64 from "@seocraft/core/src/worker/autocomplete/definitions/base64-js.json";
import moment from "@seocraft/core/src/worker/autocomplete/definitions/moment.json";
import forge from "@seocraft/core/src/worker/autocomplete/definitions/forge.json";
import { start } from "@seocraft/core/src/worker/main";
import { isNil } from "lodash-es";
import { WorkerMessenger } from "@seocraft/core/src/worker/messenger";
import { JSONSchema } from "openai/lib/jsonschema";
import { ControlContainer } from "../control-container";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

class SecretWidget extends WidgetType {
  constructor(readonly value: string = "") {
    super();
  }

  eq(other: SecretWidget) {
    return other.value == this.value;
  }

  toDOM() {
    let wrap = document.createElement("span");
    wrap.setAttribute("aria-hidden", "true");
    wrap.className =
      "py-1 px-2 rounded bg-primary border-foreground/50 shadow text-primary-foreground font-mono text";
    wrap.innerText = this.value;
    return wrap;
  }

  ignoreEvent() {
    return false;
  }
}

const secretMatcher = new MatchDecorator({
  regexp: /\(?await\s+getSecret\("(.+?)"\)\)?/g,
  decoration: (match) =>
    Decoration.replace({
      widget: new SecretWidget(match[1]),
    }),
});

const secret = ViewPlugin.fromClass(
  class {
    secrets: DecorationSet;
    constructor(view: EditorView) {
      this.secrets = secretMatcher.createDeco(view);
    }
    update(update: ViewUpdate) {
      this.secrets = secretMatcher.updateDeco(update, this.secrets);
    }
  },
  {
    decorations: (instance) => instance.secrets,
    provide: (plugin) =>
      EditorView.atomicRanges.of((view) => {
        return view.plugin(plugin)?.secrets || Decoration.none;
      }),
  },
);

export function CustomInput(props: { data: InputControl }) {
  console.log("CustomInput", props.data);
  const value = useSelector(props.data?.actor, props.data.selector);
  const [format, setFormat] = useState(props.data.definition?.format || "text");

  const parseValue = useCallback(parseValueFN, []);

  const libraries: string[] = useMemo(
    () => props.data.definition["x-libraries"] || [],
    [],
  );

  const handledChange = useCallback((val: string) => {
    props.data.setValue(val);
    // const res = parseValue(val);
    // match(res)
    //   .with({ expression: P.string }, () => {
    //     if (props.data.definition?.format === "expression") return;
    //     console.log("SEINGINexpression".repeat(20));
    //     props.data.actor.send({
    //       type: "UPDATE_SOCKET",
    //       params: {
    //         name: props.data.definition["x-key"],
    //         side: "input",
    //         socket: {
    //           format: "expression",
    //         },
    //       },
    //     });
    //   })
    //   .with({ secretKey: P.string }, () => {
    //     if (props.data.definition?.format === "secret") return;
    //     console.log("SEINGINexpression".repeat(20));
    //     props.data.actor.send({
    //       type: "UPDATE_SOCKET",
    //       params: {
    //         name: props.data.definition["x-key"],
    //         side: "input",
    //         socket: {
    //           format: "secret",
    //         },
    //       },
    //     });
    //   })
    //   .otherwise(() => {
    //     if (isNil(props.data.definition?.format)) return;
    //     console.log("SEINGINexpression".repeat(20));
    //     props.data.actor.send({
    //       type: "UPDATE_SOCKET",
    //       params: {
    //         name: props.data.definition["x-key"],
    //         side: "input",
    //         socket: {
    //           format: undefined,
    //         },
    //       },
    //     });
    //   });
  }, []);

  const { data: creds } = api.credentials.list.useQuery({});
  const [open, setOpen] = useState(false);

  return (
    <ControlContainer id={props.data.id} definition={props.data.definition}>
      <div className="flex w-full items-center justify-between">
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
        <Select
          value={props.data.definition.format || "text"}
          onValueChange={(val) => {
            props.data.actor.send({
              type: "UPDATE_SOCKET",
              params: {
                name: props.data.definition["x-key"],
                side: "input",
                socket: {
                  format: val === "text" ? undefined : val,
                },
              },
            });
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="text">Text</SelectItem>
            <SelectItem value="expression">Expression</SelectItem>
            <SelectItem value="secret">Variable</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {format === "expression" && (
        <CMInput
          value={value}
          onChange={handledChange}
          libraries={libraries}
          id={props.data.id}
          readonly={props.data.options.readonly || false}
        />
      )}
      {format === "text" && (
        <Input
          value={value}
          onChange={(e) => {
            handledChange(e.target.value);
          }}
          disabled={props.data.options.readonly}
        />
      )}
    </ControlContainer>
  );
}

const CMExtensions = [
  secret,
  javascript({ jsx: false }),
  autocompletion({
    activateOnTyping: true,
    activateOnTypingDelay: 300,
    optionClass: (completion) => {
      return `cm-completion cm-completion-${completion.type}`;
    },
  }),
  keymap.of(vscodeKeymap),
  keymap.of([
    { key: "c-Space", run: startCompletion },
    { key: "Mod-Space", run: startCompletion },
    indentWithTab,
  ]),
  indentationMarkers(),
];

const CMInput = (props: {
  value: string;
  onChange: (val: string) => void;
  libraries: string[];
  id: string;
  readonly: boolean;
}) => {
  const { systemTheme } = useTheme();
  const getFile = useCallback(
    (ts: any, name: any, c: any) => props.value,
    [props.value],
  );

  // XXX: Normally we would use the top level worker for this,
  // but it is hidden somewhere in the core and we can't access it.
  const [worker, setWorker] = useState<WorkerMessenger | null>(null);
  const { current: ternServer } = useRef(createTernServer());

  useEffect(() => {
    const worker_ = start();
    setWorker(worker_);
    return () => worker_.destroy();
  }, []);
  const librariesOld = usePreviousDistinct(props.libraries, (p, n) =>
    _.isEqual(p, n),
  );

  useEffect(() => {
    if (!worker) {
      return;
    }

    const toInstall = _.difference(props.libraries, librariesOld || []);
    const toRemove = _.difference(librariesOld || [], props.libraries);
    if (toInstall.length === 0 && toRemove.length === 0) return;

    (async () => {
      // First we reset the worker context so we can re-install
      // libraries to remove to get their defs generated.
      await worker.postoffice.resetJSContext();
      for (const lib of toRemove) {
        if (!lib) continue;
        const resp = await worker.postoffice.installLibrary(lib);
        ternServer.deleteDefs(resp.defs["!name"]);
      }

      // Now we can clean install the libraries we want.
      await worker.postoffice.resetJSContext();
      for (const lib of toInstall) {
        if (!lib) continue;
        const resp = await worker.postoffice.installLibrary(lib);
        ternServer.addDefs(resp.defs);
      }
    })();
  }, [props.libraries, worker]);

  const handledChange = (val: string) => {
    props.onChange(val);
  };

  function createTernServer() {
    return new tern.Server({
      async: true,
      defs: [ecma as any, lodash, base64, moment, forge],
      plugins: {
        doc_comment: {},
      },
      getFile: function (name, c) {
        return getFile(self, name, c);
      },
    });
  }

  const extensions = useMemo(() => {
    return [...CMExtensions, cdnPackageCompletions(ternServer)];
  }, [ternServer]);

  const editor = useRef<HTMLDivElement | null>(null);
  const { setContainer } = useCodeMirror({
    container: editor.current,
    theme: systemTheme === "dark" ? githubDark : githubLight,
    extensions,
    className: "bg-muted/30 w-full rounded-lg p-2 outline-none",
    width: "100%",
    height: "100%",
    basicSetup: {
      lineNumbers: false,
      autocompletion: true,
      foldGutter: false,
    },
    onChange: (val, viewUpdate) => {
      handledChange(val);
    },
    value: props.value,
  });
  useEffect(() => {
    if (editor.current) {
      setContainer(editor.current);
    }
  }, [editor.current]);

  return <div ref={editor} />;
};

// Got from tern.js for CM5
// Base CM6 Autocomplete library defines simple icons for
// class, constant, enum, function, interface, keyword,
// method, namespace, property, text, type, and variable.
//
// TODO: Extend this to support more types. We also need icons if we do so.
// prettier-ignore
function typeToIcon(type: any) {
  var suffix;
  if (type == "?") suffix = "unknown";
  else if (type == "number" || type == "string" || type == "bool") suffix = type;
  else if (/^fn\(/.test(type)) suffix = "function";
  else if (/^\[/.test(type)) suffix = "array";
  else suffix = "object";
  return suffix;
}

function parseValueFN(value: string) {
  const secret = /^\(?await getSecret\("([^"]+)"\)\)?$/;
  const expression = /^ctx\["root"\](?:\["[^"]+"\])+$/;

  if (secret.test(value)) {
    const key = value?.match(secret)?.[1];
    if (!key) return value;
    return { secretKey: key };
  }

  if (expression.test(value)) {
    return { expression: value };
  }

  return value;
}

/**
 * Generate JSDOC signature for the given inputs.
 */
function generateSignatureJSDOC(schema: JSONSchema) {
  const typedef = jsdoc(schema);

  return `\
${typedef}

/**
 * @typedef {object} Context
 * @property {Inputs} inputs
 */

/**
 * @param {Context} context
 */\n`;
}

const cdnPackageCompletions = (ternServer: tern.Server) => {
  async function autocompleteProvider(context: CompletionContext) {
    let before = context.matchBefore(/\w+/);
    let completions = await getAutocompletion(
      context.state.doc.toString(),
      context.state.selection.main.head,
    );

    if (!context.explicit && !before) {
      return null;
    }

    return {
      from: before ? before.from : context.pos,
      options: completions as Completion[],
      validFor: /^\w*$/,
    };
  }

  async function getAutocompletion(code: string, position: number) {
    const schema = {
      title: "Inputs",
      type: "object",
      properties: {
        // name: { type: "string", description: "A person's name" },
        // age: { type: "integer", description: "A person's age" },
        // school: { type: "number", description: "A person's age" },
      },
      required: [],
    };

    const jsdoc = generateSignatureJSDOC(schema);
    const query: tern.Query = {
      types: true,
      docs: true,
      urls: true,
      includeKeywords: true,
      type: "completions",
      end: position + jsdoc.length,
      file: "temp.js",
    };

    const file: tern.File = {
      type: "full",
      name: "temp.js",
      // TODO: Pass correct inputs and their types.
      text: jsdoc + code,
    } as any;

    return new Promise<Completion[]>((resolve, reject) => {
      ternServer?.request({ query, files: [file] }, (error, res: any) => {
        if (error) {
          return reject(error);
        }
        resolve(
          res?.completions
            .map(
              (item: any) =>
                ({
                  label: item.name,
                  apply: item.name,
                  // detail: item.type && `${item.type}`,
                  type: item.isKeyword ? "keyword" : typeToIcon(item.type),
                  info: item.doc,
                }) as Completion,
            )
            .filter((c: Completion) => !!c.label),
        );
      });
    });
  }
  const cdnPackageCompletions = javascriptLanguage.data.of({
    autocomplete: autocompleteProvider,
  });
  return cdnPackageCompletions;
};
