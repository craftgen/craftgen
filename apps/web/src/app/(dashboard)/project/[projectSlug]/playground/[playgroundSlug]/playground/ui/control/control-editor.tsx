import { v4 as uuidv4 } from "uuid";
import { ClassicPreset } from "rete";
import { Editor } from "@/components/editor";
import { useEffect, useState } from "react";
import { MyValue } from "@/lib/plate/plate-types";

type ArticleControlOptions = {
  initial: MyValue;
  change: (value: MyValue) => void;
};

export class ArticleControl extends ClassicPreset.Control {
  __type = "editor";

  constructor(public value: MyValue, public options: ArticleControlOptions) {
    super();
    if (typeof options?.initial !== "undefined") this.value = options.initial;
  }

  setValue(value: MyValue) {
    this.value = value;
    if (this.options?.change) this.options.change(value);
  }
}

const initialValue: MyValue = [
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

export function ArticleEditor<T extends MyValue>(props: {
  data: ArticleControl;
}) {
  const [val, setVal] = useState<MyValue>(props.data.value || initialValue);

  useEffect(() => {
    setVal(props.data.value!);
  }, [props.data.value]);

  const handleChange = (value: any) => {
    setVal(value);
    props.data.setValue(value as T);
  };

  return (
    <div className="flex-1 h-full w-full">
      <Editor id={"editor"} initialValue={val} onChange={handleChange} />
    </div>
  );
}
