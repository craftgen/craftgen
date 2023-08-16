import Editor from "react-simple-code-editor";
import { ClassicPreset } from "rete";
import { highlight, languages } from "prismjs";
import { useEffect, useMemo, useRef, useState } from "react";
import { Drag } from "rete-react-plugin";
import "prismjs/components/prism-json";
import "prismjs/components/prism-handlebars";
import "prismjs/themes/prism.css"; //Example style, you can use another

export class CodeControl<T extends string> extends ClassicPreset.Control {
  __type = "code";

  constructor(
    public value: string,
    public language: string,
    public setValue: (value: T) => void
  ) {
    super();
  }
}

export function CodeEditor<T extends string>(props: { data: CodeControl<T> }) {
  const [code, setCode] = useState(props.data.value || "");
  useEffect(() => {
    setCode(props.data.value || "");
  }, [props.data.value]);
  const ref = useRef(null);
  Drag.useNoDrag(ref);
  const handleChange = (value: string) => {
    setCode(value);
    props.data.setValue(value as T);
  };
  const highlightFunc = useMemo(() => {
    return (code: string) => {
      console.log({
        code,
        b: languages["js"],
        a: props.data.language,
      });
      return highlight(code, languages["js"], "js");
    };
  }, [props.data.language]);
  return (
    <div ref={ref}>
      <Editor
        value={code}
        className="bg-muted h-full"
        onValueChange={handleChange}
        highlight={highlightFunc}
        padding={10}
        style={{
          fontFamily: '"Fira code", "Fira Mono", monospace',
          fontSize: 12,
        }}
      />
    </div>
  );
}
