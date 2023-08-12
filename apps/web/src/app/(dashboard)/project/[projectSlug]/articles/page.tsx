'use client';

import { Editor } from "@/components/editor";
import { useState } from "react";

const initialValue = [
  {
    type: "p",
    children: [
      {
        text: "This is editable plain text with react and history plugins, just like a <textarea>!",
      },
    ],
  },
];
const ArticlesPage = () => {
  const [val, setVal] = useState<any>();
  return (
    <div>
      <h1>Articles</h1>
      {val && <pre>{JSON.stringify(val, null, 2)}</pre>}
      <Editor initialValue={initialValue} onChange={(v) => setVal(v)} />
    </div>
  );
};

export default ArticlesPage;
