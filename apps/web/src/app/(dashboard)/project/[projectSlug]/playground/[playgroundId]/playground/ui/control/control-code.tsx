import { ClassicPreset } from "rete";
import { useEffect, useRef, useState } from "react";
import { Drag } from "rete-react-plugin";

import Editor from "@monaco-editor/react";
import { useTheme } from "next-themes";

type CodeControlOptions = {
  initial: string;
  change: (value: string) => void;
};

export class CodeControl extends ClassicPreset.Control {
  __type = "code";
  value?: string;

  constructor(public language: string, public options: CodeControlOptions) {
    super();
    if (typeof options?.initial !== "undefined") this.value = options.initial;
  }

  setValue(value: string) {
    this.value = value;
    if (this.options?.change) this.options.change(value);
  }
}

export function CodeEditor<T extends string>(props: { data: CodeControl }) {
  const [code, setCode] = useState(props.data.value);

  useEffect(() => {
    setCode(props.data.value);
  }, [props.data.value]);

  const ref = useRef(null);
  Drag.useNoDrag(ref);

  const handleChange = (value: any) => {
    setCode(value);
    props.data.setValue(value as T);
  };
  const { theme } = useTheme();
  return (
    <div ref={ref} className="h-full w-full">
      <Editor
        defaultValue={code}
        theme={theme === "dark" ? "vs-dark" : "light"}
        language={props.data.language}
        className="h-full min-h-[10rem] border  rounded flex-1"
        height={"100%"}
        options={{
          minimap: {
            enabled: false,
          },
          lineNumbers: "off",
        }}
        onChange={handleChange}
      />
    </div>
  );
}
