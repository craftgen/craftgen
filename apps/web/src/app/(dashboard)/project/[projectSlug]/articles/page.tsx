import { Editor } from "@/components/editor";


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
  return (
    <div>
      <h1>Articles</h1>
      <Editor initialValue={initialValue} />
    </div>
  );
};

export default ArticlesPage;
