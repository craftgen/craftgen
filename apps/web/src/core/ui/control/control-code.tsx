import { useEffect, useState } from "react";
import Editor from "@monaco-editor/react";
import { useMeasure } from "react-use";

import type { CodeControl } from "@seocraft/core/src/controls/code";

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
      className="rounded"
      wrapperProps={{ className: "h-full w-full min-h-[10rem] border rounded" }}
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
