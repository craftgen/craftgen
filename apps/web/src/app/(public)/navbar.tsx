"use client";

import { useState } from "react";
import Link from "next/link";
import { Session } from "@supabase/supabase-js";

import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@craftgen/ui/components/dialog";
import { Icons } from "@craftgen/ui/components/icons";
import { ThemeToggle } from "@craftgen/ui/components/theme-toggle";

import { StarCount } from "@/components/marketing/github-star-count";

const MenuDropdown = ({ session }: { session: Session | null }) => {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={(v) => setOpen(v)}>
      <DialogTrigger
        type="button"
        className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700 lg:hidden"
      >
        <span className="sr-only">Open main menu</span>
        <svg
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
          />
        </svg>
      </DialogTrigger>

      <DialogContent className="flex h-full max-h-[70vh] flex-col items-center justify-center space-y-8 text-3xl lg:hidden">
        {/* <Link
          onClick={() => setOpen(false)}
          href="/about"
          className=" flex  items-center font-semibold leading-6"
        >
          About
        </Link> */}
        <Link
          onClick={() => setOpen(false)}
          href="/docs"
          className=" flex  items-center font-semibold leading-6"
        >
          Docs
        </Link>
        <Link
          onClick={() => setOpen(false)}
          href="/features"
          className=" flex  items-center font-semibold leading-6"
        >
          Roadmap
          <Icons.externalLink className="h-4 w-4" />
        </Link>
        <Link
          onClick={() => setOpen(false)}
          href="/integrations"
          className=" flex  items-center font-semibold leading-6"
        >
          Integrations
        </Link>
        <Link
          href="/careers"
          className=" flex items-center text-lg font-semibold leading-6"
        >
          Careers
        </Link>
        {/* <SessionButton onClick={() => setOpen(false)} session={session} /> */}
      </DialogContent>
    </Dialog>
  );
};

export const NavBar = ({ session }: { session: Session | null }) => {
  return (
    <>
      <nav
        className="sticky top-0 z-50 mx-auto  w-full bg-background/80 px-6 py-4 backdrop-blur-sm lg:px-8 "
        aria-label="Global"
      >
        <div className="mx-auto flex  max-w-[90rem] items-center  justify-between">
          <div className="flex flex-row items-center  lg:flex-1">
            <Link href="/" className="-m-1.5 mr-4 p-1.5">
              <span className="sr-only">Craftgen</span>
              {/* <Logo className={"h-12 w-12"} /> */}
              <h1 className="font-sans text-2xl  font-black tracking-tighter  md:text-5xl">
                CraftGen
              </h1>
            </Link>

            <StarCount />
          </div>

          <MenuDropdown session={session} />

          <div className="hidden lg:flex lg:gap-x-12">
            {/* <Link
            href={"/about"}
            className=" flex items-center text-lg font-semibold leading-6"
          >
            About
          </Link> */}
            <Link
              href="/docs"
              className=" flex items-center text-lg font-semibold leading-6"
            >
              Docs
            </Link>
            <Link
              href="/integrations"
              className=" flex items-center text-lg font-semibold leading-6"
            >
              Integrations
            </Link>
            <Link
              href="https://github.com/orgs/craftgen/projects/1/views/2"
              target="_blank"
              className=" flex  items-center font-semibold leading-6"
            >
              Roadmap
              <Icons.externalLink className="h-4 w-4" />
            </Link>
            <Link
              href="/careers"
              className=" flex items-center text-lg font-semibold leading-6"
            >
              Careers
            </Link>
          </div>
          <div className="hidden lg:flex lg:flex-1 lg:justify-end">
            {/* <SessionButton session={session} /> */}
            <ThemeToggle />
          </div>
        </div>
      </nav>
    </>
  );
};
