import { usePlateEditorState } from "@udecode/plate-common";

import { Button } from "./button";

export const ArticleSaveButton: React.FC<{ id: string }> = ({ id }) => {
  const plate = usePlateEditorState();
  const handleSave = async () => {
    // await updateArticle({
    //   id,
    //   nodes: plate.children,
    // });
  };
  return (
    <Button size={"sm"} onClick={handleSave}>
      Save
    </Button>
  );
};
