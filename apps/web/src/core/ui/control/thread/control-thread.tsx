import { useSelector } from "@xstate/react";

import {
  Message,
  ThreadControl,
} from "@seocraft/core/src/controls/thread.control";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

import { InputSection } from "./input-section";
import { Content } from "./shared";

export const ThreadControlComponent = (props: { data: ThreadControl }) => {
  console.log(props.data.id, { props });
  if (!props.data.actor) {
    return null;
  }
  // return null;
  const actor = props.data.actor;

  const messages = useSelector(props.data.actor, props.data.selector);

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
        <Messages messages={messages || []} />
        <InputSection handleAdd={handleAdd} handleAddAndRun={handleAddAndRun} />
      </div>
    </div>
  );
};
const Messages = (props: { messages: Message[] }) => {
  console.log({
    messages: props.messages,
  });
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
