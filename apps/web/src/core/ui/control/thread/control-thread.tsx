import { useSelector } from "@xstate/react";

import {
  Message,
  ThreadControl,
} from "@seocraft/core/src/controls/thread.control";
import { ThreadMachineEvents } from "@seocraft/core/src/nodes/thread";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

import { InputSection } from "./input-section";
import { Content } from "./shared";

export const ThreadControlComponent = (props: { data: ThreadControl }) => {
  // console.log(props.data.id, { props });
  if (!props.data.actor) {
    return null;
  }
  // return null;
  const actor = props.data.actor;

  const messages = useSelector(props.data.actor, props.data.selector);
  const state = useSelector(props.data.actor, (state) => state);

  const handleAdd = (value: string) => {
    actor.send({
      type: ThreadMachineEvents.addMessage,
      params: {
        content: value,
        role: "user",
      },
    });
  };
  const handleAddAndRun = (value: string) => {
    actor.send({
      type: ThreadMachineEvents.addAndRunMessage,
      params: {
        content: value,
        role: "user",
      },
    });
  };
  const canAdd = state.can({
    type: ThreadMachineEvents.addMessage,
  } as any);
  const canAddAndRun = state.can({
    type: ThreadMachineEvents.addAndRunMessage,
  } as any);
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
            onClick={() =>
              actor.send({ type: ThreadMachineEvents.clearThread })
            }
            variant={"outline"}
            disabled={
              !state.can({
                type: ThreadMachineEvents.clearThread,
              })
            }
          >
            Clear Thread
          </Button>
        </div>
      </div>
      <div className="border-1 p-2">
        <Messages messages={messages || []} />
        <InputSection
          handleAdd={handleAdd}
          canAdd={canAdd}
          handleAddAndRun={handleAddAndRun}
          canAddAndRun={canAddAndRun}
        />
      </div>
    </div>
  );
};
const Messages = (props: { messages: Message[] }) => {
  return (
    <div className="min-h-[10rem] flex-1">
      <ScrollArea>
        {props.messages.map((message) => (
          <MessageItem key={message.id} message={message} />
        ))}
      </ScrollArea>
    </div>
  );
};

const MessageItem = ({ message }: { message: Message }) => {
  return (
    <div>
      <div className="font-bold">{message.role}</div>
      <div className="p-2">
        <Content content={message.content} />
      </div>
    </div>
  );
};
