"use client";

import { PropsWithChildren, useState } from "react";
import { CheckSquare, Copy } from "lucide-react";
import { useCopyToClipboard } from "react-use";

export const Copyable: React.FC<PropsWithChildren<{ value: string }>> = ({
  value,
  children,
}) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    copyToClipboard(value);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 1000);
  };
  const [_, copyToClipboard] = useCopyToClipboard();
  return (
    <span onClick={handleCopy} className="flex cursor-pointer items-center">
      {children}
      {copied ? (
        <CheckSquare className="ml-2  h-4 w-4 text-green-500" />
      ) : (
        <Copy className="ml-2 h-4 w-4 " />
      )}
    </span>
  );
};
