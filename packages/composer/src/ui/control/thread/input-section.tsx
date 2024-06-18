import { useState } from "react";
import { Paperclip } from "lucide-react";

import { Button } from "@craftgen/ui/components/button";
import { Textarea } from "@craftgen/ui/components/textarea";

export const InputSection: React.FC<{
  handleAdd: (value: string) => void;
  handleAddAndRun: (value: string) => void;
  canAdd?: boolean;
  canAddAndRun?: boolean;
}> = ({
  handleAdd: _add,
  handleAddAndRun: _addAndRun,
  canAdd,
  canAddAndRun,
}) => {
  const [value, setValue] = useState("");

  const handleAddAndRun = () => {
    _addAndRun(value);
    setValue("");
  };

  const handleAdd = () => {
    _add(value);
    setValue("");
  };

  return (
    <div className="rounded border bg-background p-2">
      <Textarea
        className="border-none bg-muted"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <div className="flex items-center justify-start space-x-2 pt-2 focus-visible:ring-0">
        <Button onClick={handleAddAndRun} disabled={!canAddAndRun}>
          Add and Run
        </Button>
        <Button onClick={handleAdd} disabled={!canAdd}>
          Add
        </Button>
        <Button variant={"outline"} size="icon">
          <Paperclip className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
