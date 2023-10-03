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

  const handleChange = (value: any) => {
    setCode(value);
    props.data.setValue(value as T);
  };
  const [ref, { height }] = useMeasure<HTMLDivElement>();
  return (
    <Editor
      loading={null}
      keepCurrentModel={true}
      value={code}
      defaultValue={code}
      theme={props.data.options.theme === "dark" ? "vs-dark" : "light"}
      language={props.data.language}
      className="h-full border object-fill rounded "
      height={200}
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
  );
}
