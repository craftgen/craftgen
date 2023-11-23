import { useState } from "react";
import { Paperclip } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export const InputSection: React.FC<{
  handleAdd: (value: string) => void;
  handleAddAndRun: (value: string) => void;
}> = ({ handleAdd: _add, handleAddAndRun: _addAndRun }) => {
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
    <div className="rounded border p-2">
      <Textarea
        className="border-none"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <div className="flex items-center justify-start space-x-2 pt-2 focus-visible:ring-0">
        <Button onClick={handleAddAndRun}>Add and Run</Button>
        <Button onClick={handleAdd}>Add</Button>
        <Button variant={"outline"} size="icon">
          <Paperclip className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};