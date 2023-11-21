import { ThreadControl } from "@seocraft/core/src/controls/thread.control";

import { Copyable } from "@/components/copyable";
import { Button } from "@/components/ui/button";

import { InputSection } from "./input-section";

export const ThreadControlComponent = (props: { data: ThreadControl }) => {
  const actor = props.data.actor;

  const handleAdd = (value: string) => {
    actor.send({
      type: "ADD_MESSAGE",
      params: {
        content: value,
        role: "user",
      },
    });
  };
  const handleAddAndRun = (value: string) => {
    actor.send({
      type: "ADD_AND_RUN_MESSAGE",
      params: {
        content: value,
        role: "user",
      },
    });
  };
  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <p className="text-sm font-bold">Thread</p>
          {/* <Copyable value={props.data.threadId}>
            <span className="text-muted-foreground ml-2">
              {props.data.threadId}
            </span>
          </Copyable> */}
        </div>
        <div>
          <Button
            onClick={() => actor.send({ type: "CLEAR_THREAD" })}
            variant={"outline"}
          >
            Clear Thread
          </Button>
        </div>
      </div>
      <div className="border-1 p-2">
        {/* <Messages messages={messagesList || []} /> */}
        <InputSection handleAdd={handleAdd} handleAddAndRun={handleAddAndRun} />
      </div>
    </div>
  );
};
