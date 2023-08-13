import Editor from "react-simple-code-editor";
import { ClassicPreset } from "rete";
import { highlight, languages } from "prismjs";
import { useEffect, useRef, useState } from "react";
import { Drag } from "rete-react-plugin";
import "prismjs/components/prism-json";
import "prismjs/themes/prism.css"; //Example style, you can use another

export class CodeControl extends ClassicPreset.Control {
  __type = "code";

  constructor(public value: string, language: string) {
    super();
  }
}

export function CodeEditor(props: { data: CodeControl }) {
  const [code, setCode] = useState(props.data.value || "");
  useEffect(() => {
    setCode(props.data.value || "");
  }, [props.data.value]);
  const ref = useRef(null);
  Drag.useNoDrag(ref);

  return (
    <div ref={ref}>
      <Editor
        value={code}
        className="bg-muted h-full"
        onValueChange={(code) => setCode(code)}
        highlight={(code) => highlight(code, languages.json, "json")}
        padding={10}
        style={{
          fontFamily: '"Fira code", "Fira Mono", monospace',
          fontSize: 12,
        }}
      />
    </div>
  );
}
