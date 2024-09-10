"use client";

import { useState } from "react";
import { sendToBackgroundViaRelay } from "@plasmohq/messaging";

import { Button } from "@craftgen/ui/components/button";

export const RelayTesting = () => {
  const [count, setCount] = useState(0);
  const handleMessage = async () => {
    setCount(count + 1);
    const resp = await sendToBackgroundViaRelay({
      name: "workflow-execute" as never,
      body: {
        count,
        name: "test",
      },
    });

    console.log(resp);
  };
  return (
    <div>
      <Button onClick={handleMessage}>Relay message {count}</Button>
    </div>
  );
};
