"use client";

import Link from "next/link";
import useSWR from "swr";

import { Icons } from "@craftgen/ui/components/icons";
import NumberTicker from "@craftgen/ui/components/number-ticker";

export const StarCount: React.FC = () => {
  const { data } = useSWR(
    "https://api.github.com/repos/craftgen/craftgen",
    async () => {
      const res = await fetch(
        "https://api.github.com/repos/craftgen/craftgen",
        {
          method: "GET",
          next: { revalidate: 60 },
        },
      );
      const data = await res.json();

      const stargazers_count: number = data.stargazers_count;
      return stargazers_count;
    },
    {
      keepPreviousData: true,
    },
  );
  return (
    <div className="flex">
      <Link
        href="https://github.com/craftgen/craftgen"
        className=" caption-s border-slate-7  bg-slate-3 text-slate-12 hover:border-slate-8 hover:bg-slate-4 flex animate-shimmer items-center gap-1 rounded-l-[4px] border bg-[linear-gradient(110deg,#fff,45%,#0284c720,55%,#fff)] bg-[length:200%_100%] px-2 py-[2px] font-medium dark:bg-[linear-gradient(110deg,#000103,45%,#1e2631,55%,#000103)]"
      >
        <Icons.gitHub className="fill-slate-12 h-5 w-5" />
        <span className="">Star</span>
      </Link>
      <Link
        href="https://github.com/craftgen/craftgen"
        className="border-slate-7 bg-slate-1 hover:bg-slate-2 group inline-flex items-center rounded-r-[4px] border-y border-r px-2 py-[2px]"
      >
        <span className="caption-s text-slate-12 font-medium group-hover:text-primary">
          {!!data ? <NumberTicker value={data} /> : "⭐"}
        </span>
      </Link>
    </div>
  );
};
