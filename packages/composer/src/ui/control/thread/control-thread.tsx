import React from "react";
import { useSelector } from "@xstate/react";
import { CheckSquare, Copy } from "lucide-react";
import { useCopyToClipboard } from "react-use";

import { Message, ThreadControl } from "@craftgen/core/controls/thread.control";
import { ThreadMachineEvents } from "@craftgen/core/nodes/thread";
import { Button } from "@craftgen/ui/components/button";
import { ScrollArea } from "@craftgen/ui/components/scroll-area";
import { cn } from "@craftgen/ui/lib/utils";

import { InputSection } from "./input-section";
import { Content } from "./shared";

export const ThreadControlComponent = (props: { data: ThreadControl }) => {
  const { definition, parent } = useSelector(
    props.data?.actor,
    (snap) => snap.context,
  );
  const actor = props.data?.actor.system.get(parent.id);
  const state = useSelector(actor, (state) => state);
  const messages = useSelector(
    actor,
    (snap) => snap.context.inputs[definition["x-key"]],
  );

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
  const [copyToClipboardState, copyToClipboard] = useCopyToClipboard();
  const [copied, setCopied] = React.useState(false);
  const handleCopy = () => {
    copyToClipboard(message.content);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 1000);
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="font-bold capitalize">{message.role}</div>
        <div>
          <Button
            variant={"ghost"}
            onClick={handleCopy}
            className={cn(copied && "hover:text-green-500")}
          >
            {copied ? (
              <CheckSquare className="ml-1  h-4 w-4 animate-ping" />
            ) : (
              <Copy className="ml-1  h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
      <div className="p-2">
        <Content content={message.content} />
      </div>
    </div>
  );
};
