import { useEffect, useState } from "react";

import Editor from "@monaco-editor/react";
import { useTheme } from "next-themes";
import { useMeasure, useSize } from "react-use";
import { CodeControl } from "../../controls/code";

export function CodeEditor<T extends string>(props: { data: CodeControl }) {
  const [code, setCode] = useState(props.data.value);

  useEffect(() => {
    setCode(props.data.value);
  }, [props.data.value]);

  // const ref = useRef(null);
  // Drag.useNoDrag(ref);

  const handleChange = (value: any) => {
    setCode(value);
    props.data.setValue(value as T);
  };
  const { theme } = useTheme();
  const [ref, { height }] = useMeasure<HTMLDivElement>();
  return (
    // <div ref={ref} className="flex-1 h-full w-full  bg-red-500">
    //   {height}
    <Editor
      defaultValue={code}
      theme={theme === "dark" ? "vs-dark" : "light"}
      language={props.data.language}
      className="min-h-[20rem] h-full border object-fill rounded "
      height={height - 200}
      options={{
        minimap: {
          enabled: false,
        },
        lineNumbers: "off",
        wordWrap: "on",
        wordWrapColumn: 80,
        scrollBeyondLastLine: false,
      }}
      onChange={handleChange}
    />
    // </div>
  );
}
