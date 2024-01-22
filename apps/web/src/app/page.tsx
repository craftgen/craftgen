"use client";

import { ModeToggle } from "@/components/theme-toggle";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-start ">
      <div className="flex w-full justify-end p-1">
        <ModeToggle />
      </div>

    </main>
  );
}
