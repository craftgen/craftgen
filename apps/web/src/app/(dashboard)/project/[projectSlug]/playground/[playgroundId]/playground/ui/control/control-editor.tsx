import { v4 as uuidv4 } from "uuid";
import { ClassicPreset } from "rete";
import { Editor } from "@/components/editor";
import { useState } from "react";

export class ArticleControl extends ClassicPreset.Control {
  __type = "editor";
  value?: string;

  constructor(public language: string, public options: any) {
    super();
    if (typeof options?.initial !== "undefined") this.value = options.initial;
  }

  setValue(value: string) {
    this.value = value;
    if (this.options?.change) this.options.change(value);
  }
}

const initialValue = [
  {
    type: "h1",
    id: uuidv4(),
    children: [
      {
        text: "",
      },
    ],
  },
];

export function ArticleEditor<T extends string>(props: {
  data: ArticleControl;
}) {
  const [val, setVal] = useState<any>();

  return (
    <div className="flex-1 h-full w-full">
      <Editor
        id={"editor"}
        initialValue={initialValue}
        onChange={(v) => setVal(v)}
      />
    </div>
  );
}
