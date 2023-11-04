import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";

import { Editor } from "@/components/editor";
import type { MyValue } from "@/lib/plate/plate-types";
import type { ArticleControl } from "@seocraft/core/src/controls/article";


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
    setVal(props.data.value);
  }, [props.data.value]);

  const handleChange = (value: any) => {
    setVal(value);
    props.data.setValue(value as T);
  };

  return (
    <div className="h-full w-full flex-1">
      <Editor id={"editor"} initialValue={val} onChange={handleChange} />
    </div>
  );
}
