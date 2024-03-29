"use client";
import Link from "next/link";
// import { Logo } from "../logo";
// import { SessionButton } from "./session-button";
import { useState } from "react";
import type { Session } from "@supabase/auth-helpers-nextjs";
import { Dialog, DialogTrigger, DialogContent } from "@/components/ui/dialog";

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
          href="/blog"
          className=" flex  items-center font-semibold leading-6"
        >
          Blog
        </Link>
        {/* <Link
          onClick={() => setOpen(false)}
          href="/features"
          className=" flex  items-center font-semibold leading-6"
        >
          Features
        </Link> */}
        <Link
          onClick={() => setOpen(false)}
          href="/integrations"
          className=" flex  items-center font-semibold leading-6"
        >
          Integrations
        </Link>
        {/* <SessionButton onClick={() => setOpen(false)} session={session} /> */}
      </DialogContent>
    </Dialog>
  );
};

export const NavBar = ({ session }: { session: Session | null }) => {
  return (
    <>
      {/* {session?.user && !session?.user?.subs ? (
        <HeaderDiscount
          text={
            "Use promo code FATHER2023 to get 10% discount before 18th of June!"
          }
        />
      ) : (
        <Link href="/login">
          <HeaderDiscount
            text={"Create free account to get 10% off before Father's Day!"}
          />
        </Link>
      )} */}
      <nav
        className="mx-auto flex max-w-7xl items-center justify-between p-6 lg:px-8"
        aria-label="Global"
      >
        <div className="flex flex-row lg:flex-1">
          <Link href="/" className="-m-1.5 p-1.5">
            <span className="sr-only">Craftgen</span>
            {/* <Logo className={"h-12 w-12"} /> */}
            <h1 className="font-sans text-2xl  font-black tracking-tighter  md:text-5xl">
              CraftGen
            </h1>
          </Link>
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
            href="/blog"
            className=" flex items-center text-lg font-semibold leading-6"
          >
            Blog
          </Link>
          {/* <Link
            href="/features"
            className=" flex items-center text-lg font-semibold leading-6"
          >
            Features
          </Link> */}
          <Link
            href="/integrations"
            className=" flex items-center text-lg font-semibold leading-6"
          >
            Integrations
          </Link>
        </div>
        <div className="hidden lg:flex lg:flex-1 lg:justify-end">
          {/* <SessionButton session={session} /> */}
        </div>
      </nav>
    </>
  );
};
