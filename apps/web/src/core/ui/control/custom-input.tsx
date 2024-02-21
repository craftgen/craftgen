import { useCallback } from "react";

import { useSelector } from "@xstate/react";

import type { InputControl } from "@seocraft/core/src/controls/input.control";

import { ControlContainer } from "../control-container";
import { Input } from "@/components/ui/input";
import { ChangeFormat } from "./shared/change-format";
import { SecretDropdown } from "./shared/secret-dropdown";

export function CustomInput(props: { data: InputControl }) {
  const value = useSelector(props.data?.actor, props.data.selector);

  const handledChange = useCallback((val: string) => {
    props.data.setValue(val);
  }, []);

  return (
    <ControlContainer id={props.data.id} definition={props.data.definition}>
      <div className="flex w-full items-center justify-between">
        <SecretDropdown
          onSelect={(val) => {
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
            handledChange(val);
          }}
        />
        <ChangeFormat
          value={value}
          actor={props.data.actor}
          selector={props.data.definitionSelector}
        />
      </div>
      <Input
        value={value}
        onChange={(e) => {
          handledChange(e.target.value);
        }}
        disabled={props.data.options.readonly}
      />
    </ControlContainer>
  );
}

// const CMInput = (props: {
//   value: string;
//   onChange: (val: string) => void;
//   libraries: string[];
//   id: string;
//   readonly: boolean;
// }) => {
//   const { systemTheme } = useTheme();
//   const getFile = useCallback(
//     (ts: any, name: any, c: any) => props.value,
//     [props.value],
//   );

//   // XXX: Normally we would use the top level worker for this,
//   // but it is hidden somewhere in the core and we can't access it.
//   const [worker, setWorker] = useState<WorkerMessenger | null>(null);
//   const { current: ternServer } = useRef(createTernServer());

//   useEffect(() => {
//     const worker_ = start();
//     setWorker(worker_);
//     return () => worker_.destroy();
//   }, []);
//   const librariesOld = usePreviousDistinct(props.libraries, (p, n) =>
//     _.isEqual(p, n),
//   );

//   useEffect(() => {
//     if (!worker) {
//       return;
//     }

//     const toInstall = _.difference(props.libraries, librariesOld || []);
//     const toRemove = _.difference(librariesOld || [], props.libraries);
//     if (toInstall.length === 0 && toRemove.length === 0) return;

//     (async () => {
//       // First we reset the worker context so we can re-install
//       // libraries to remove to get their defs generated.
//       await worker.postoffice.resetJSContext();
//       for (const lib of toRemove) {
//         if (!lib) continue;
//         const resp = await worker.postoffice.installLibrary(lib);
//         ternServer.deleteDefs(resp.defs["!name"]);
//       }

//       // Now we can clean install the libraries we want.
//       await worker.postoffice.resetJSContext();
//       for (const lib of toInstall) {
//         if (!lib) continue;
//         const resp = await worker.postoffice.installLibrary(lib);
//         ternServer.addDefs(resp.defs);
//       }
//     })();
//   }, [props.libraries, worker]);

//   const handledChange = (val: string) => {
//     props.onChange(val);
//   };

//   function createTernServer() {
//     return new tern.Server({
//       async: true,
//       defs: [ecma as any, lodash, base64, moment, forge],
//       plugins: {
//         doc_comment: {},
//       },
//       getFile: function (name, c) {
//         return getFile(self, name, c);
//       },
//     });
//   }

//   const extensions = useMemo(() => {
//     return [...CMExtensions, cdnPackageCompletions(ternServer)];
//   }, [ternServer]);

//   const editor = useRef<HTMLDivElement | null>(null);
//   const { setContainer } = useCodeMirror({
//     container: editor.current,
//     theme: systemTheme === "dark" ? githubDark : githubLight,
//     extensions,
//     className: "bg-muted/30 w-full rounded-lg p-2 outline-none",
//     width: "100%",
//     height: "100%",
//     basicSetup: {
//       lineNumbers: false,
//       autocompletion: true,
//       foldGutter: false,
//     },
//     onChange: (val, viewUpdate) => {
//       handledChange(val);
//     },
//     value: props.value,
//   });
//   useEffect(() => {
//     if (editor.current) {
//       setContainer(editor.current);
//     }
//   }, [editor.current]);

//   return <div ref={editor} />;
// };
