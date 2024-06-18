import { useSelector } from "@xstate/react";
import { useTheme } from "next-themes";
import { usePreviousDistinct } from "react-use";

import "./custom-input.css";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  autocompletion,
  Completion,
  CompletionContext,
  startCompletion,
} from "@codemirror/autocomplete";
import { indentWithTab } from "@codemirror/commands";
import { javascript, javascriptLanguage } from "@codemirror/lang-javascript";
import {
  Decoration,
  DecorationSet,
  EditorView,
  keymap,
  MatchDecorator,
  ViewPlugin,
  ViewUpdate,
} from "@codemirror/view";
import { indentationMarkers } from "@replit/codemirror-indentation-markers";
import { vscodeKeymap } from "@replit/codemirror-vscode-keymap";
import { githubDark, githubLight } from "@uiw/codemirror-theme-github";
import { useCodeMirror, WidgetType } from "@uiw/react-codemirror";
// @ts-ignore
import jsdoc from "json-schema-to-jsdoc";
import { difference, get, isEqual } from "lodash-es";
import { JSONSchema } from "openai/lib/jsonschema";
import tern from "tern";
import dedent from "ts-dedent";
import { match } from "ts-pattern";

import type { CodeControl } from "@craftgen/core/controls/code";
// import base64 from "@craftgen/core/worker/autocomplete/definitions/base64-js.json";
// import ecma from "@craftgen/core/worker/autocomplete/definitions/ecmascript.json";
// import lodash from "@craftgen/core/worker/autocomplete/definitions/lodash.json";
import { start } from "@craftgen/core/worker/main";
import { WorkerMessenger } from "@craftgen/core/worker/messenger";

import { ChangeFormat } from "./shared/change-format";
import { SecretDropdown } from "./shared/secret-dropdown";

// require("tern/plugin/doc_comment");

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
  EditorView.lineWrapping,
  keymap.of(vscodeKeymap),
  keymap.of([
    { key: "c-Space", run: startCompletion },
    { key: "Mod-Space", run: startCompletion },
    indentWithTab,
  ]),
  indentationMarkers(),
];

const cdnPackageCompletions = (
  ternServer: tern.Server,
  mode: "expression" | "full" = "full",
) => {
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
        name: { type: "string", description: "A person's name" },
        age: { type: "integer", description: "A person's age" },
        school: { type: "number", description: "A person's age" },
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

    const fileContent = match(mode)
      .with("full", () => jsdoc + code)
      .with("expression", () => {
        return dedent`${jsdoc}
      async function(context: Context) { return \`${code}\` };
      `;
      })
      .run();

    console.log(fileContent);
    const file: tern.File = {
      type: "full",
      name: "temp.js",
      // TODO: Pass correct inputs and their types.
      text: fileContent,
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

export function CodeEditor<T extends string>(props: { data: CodeControl }) {
  const { definition, value: valueActor } = useSelector(
    props.data?.actor,
    (snap) => snap.context,
  );

  const [code, setValue] = useState<string>(
    valueActor?.getSnapshot().context.value || "",
  );

  const { systemTheme } = useTheme();

  const handleChange = (value: any) => {
    props.data.actor.send({
      type: "SET_VALUE",
      params: {
        value,
      },
    });
  };

  const [worker, setWorker] = useState<WorkerMessenger | null>(null);
  const { current: ternServer } = useRef(createTernServer());

  useEffect(() => {
    const worker_ = start();
    setWorker(worker_);
    return () => worker_.destroy();
  }, []);

  const libraries = useMemo(() => get(definition, ["x-libraries"], []), []);

  const librariesOld = usePreviousDistinct(libraries, (p, n) => isEqual(p, n));

  useEffect(() => {
    if (!worker) {
      return;
    }

    const toInstall = difference(libraries, librariesOld || []);
    const toRemove = difference(librariesOld || [], libraries);
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
  }, [libraries, worker]);

  const editorValue = useRef<string>(code);
  const getFile = useCallback(
    (ts: any, name: any, c: any) => editorValue.current,
    [editorValue.current],
  );
  function createTernServer() {
    return new tern.Server({
      async: true,
      // defs: [ecma as any, lodash, base64],
      defs: [],
      plugins: {
        doc_comment: {},
      },
      getFile: function (name, c) {
        return getFile(self, name, c);
      },
    });
  }

  const extensions = useMemo(() => {
    return [
      ...CMExtensions,
      cdnPackageCompletions(ternServer, definition.format),
    ];
  }, [ternServer]);
  const editorContainer = useRef<HTMLDivElement | null>(null);
  const { setContainer, view } = useCodeMirror({
    container: editorContainer.current,
    theme: systemTheme === "dark" ? githubDark : githubLight,
    extensions,
    className: "bg-muted/30 w-full rounded-lg p-2 outline-none min-h-[10rem]",
    width: "100%",
    height: "100%",
    basicSetup: {
      lineNumbers: false,
      autocompletion: true,
      foldGutter: false,
    },
    onChange: (val, viewUpdate) => {
      editorValue.current = val;
      handleChange(val);
    },
    value: code,
  });

  useEffect(() => {
    const listener = valueActor.subscribe((event: any) => {
      if (!view) return;
      const stateValue = event.context.value;
      const inSync = stateValue === editorValue.current;

      if (!inSync) {
        view.dispatch({
          changes: {
            from: 0,
            to: view.state.doc.length,
            insert: stateValue,
          },
        });
      }
    });

    return () => listener.unsubscribe();
  }, [view]);

  useEffect(() => {
    if (editorContainer.current) {
      setContainer(editorContainer.current);
    }
  }, [editorContainer.current]);

  const canChangeFormat = useSelector(props.data.actor, (snap) =>
    snap.can({
      type: "CHANGE_FORMAT",
      params: {
        value: "expression",
      },
    }),
  );

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
            view?.dispatch({
              changes: {
                from: editorValue.current?.length,
                insert: val,
              },
            });
          }}
        />
        {canChangeFormat && (
          <ChangeFormat value={editorValue.current} actor={props.data.actor} />
        )}
      </div>
      <div ref={editorContainer} className="inline-flex  w-full" />
    </>
  );
}

/**
 * Generate JSDOC signature for the given inputs.
 */
function generateSignatureJSDOC(schema: JSONSchema) {
  const typedef = jsdoc(schema);

  return dedent`
${typedef}

/**
 * @typedef {object} Context
 * @property {Inputs} inputs
 */

/**
 * @param {Context} context
 */`;
}

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
