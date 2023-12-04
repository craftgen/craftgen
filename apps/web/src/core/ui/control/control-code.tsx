import Editor from "@monaco-editor/react";
import { useSelector } from "@xstate/react";
import { useTheme } from "next-themes";
import { useMeasure } from "react-use";

import type { CodeControl } from "@seocraft/core/src/controls/code";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function CodeEditor<T extends string>(props: { data: CodeControl }) {
  const code = useSelector(props.data?.actor, props.data.selector);

  const handleChange = (value: any) => {
    props.data.setValue(value as T);
  };
  const [ref, { height }] = useMeasure<HTMLDivElement>();
  const { theme } = useTheme();

  return (
    <div className="max-h-[30vh] space-y-1" ref={ref}>
      <Label htmlFor={props.data.id}>
        {props.data?.definition?.title || props.data?.definition?.name}
      </Label>
      <Editor
        loading={null}
        keepCurrentModel={true}
        value={code}
        defaultValue={code}
        theme={theme === "dark" ? "vs-dark" : "light"}
        language={props.data.options.language || "javascript"}
        className="rounded"
        height={height - 100}
        wrapperProps={{
          className: " w-full min-h-[10rem] border rounded",
        }}
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
      <p className={cn("text-muted-foreground text-[0.8rem]")}>
        {props.data?.definition?.description}
      </p>
    </div>
  );
}
