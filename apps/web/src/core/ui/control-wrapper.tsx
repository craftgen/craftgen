import { JSONSocket } from "@seocraft/core/src/controls/socket-generator";
import { observer } from "mobx-react-lite";
import { useRef } from "react";
import { getControl } from "../control";

export const ControlWrapper: React.FC<{
  control: any;
  definition: JSONSocket;
}> = observer(({ control, definition }) => {
  const ref = useRef<HTMLDivElement>(null);
  const ControlElement = getControl({
    element: ref.current!,
    type: "control",
    payload: control,
  });

  return (
    <>
      <div
        className="flex flex-1 flex-col"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <ControlElement data={control} />
      </div>
    </>
  );
});
