"use client";

import React from "react";
import {
  CommentResolveButton as CommentResolveButtonPrimitive,
  useComment,
} from "@udecode/plate-comments";

import { Icons } from "@/components/icons";
import { buttonVariants } from "@/components/plate-ui/button";
import { cn } from "@/lib/utils";

export function CommentResolveButton() {
  const comment = useComment()!;

  return (
    <CommentResolveButtonPrimitive
      className={cn(
        buttonVariants({ variant: "ghost" }),
        "text-muted-foreground h-6 p-1",
      )}
    >
      {comment.isResolved ? (
        <Icons.refresh className="h-4 w-4" />
      ) : (
        <Icons.check className="h-4 w-4" />
      )}
    </CommentResolveButtonPrimitive>
  );
}
