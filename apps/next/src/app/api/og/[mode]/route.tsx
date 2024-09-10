/* eslint-disable react/no-unknown-property -- Tailwind CSS `tw` property */
import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

interface Mode {
  param: string;
  package: string;
  name: string;
}

const mode: Mode = {
  param: "headless",
  package: "fumadocs-core",
  name: "Craftgen.ai",
};

export const runtime = "edge";

const bold = fetch(new URL("./inter-bold.woff", import.meta.url)).then((res) =>
  res.arrayBuffer(),
);

const foreground = "hsl(0 0% 98%)";
const mutedForeground = "hsl(0 0% 63.9%)";
const background = "rgba(10, 10, 10)";

export async function GET(
  request: NextRequest,
  { params }: { params: { mode: string } },
) {
  const { searchParams } = request.nextUrl;
  const title = searchParams.get("title"),
    description = searchParams.get("description");

  return new ImageResponse(
    OG({
      title: title ?? "Craftgen",
      description: description ?? "Craftgen AI Agent Building Platform",
      mode,
    }),
    {
      width: 1200,
      height: 630,
      fonts: [{ name: "Inter", data: await bold, weight: 700 }],
    },
  ) as any;
}

function OG({
  title,
  description,
  mode,
}: {
  mode: Mode;
  title: string;
  description: string;
}): React.ReactElement {
  return (
    <div
      style={{
        color: foreground,
        background,
      }}
      tw="flex flex-col w-full h-full p-12"
    >
      <div
        style={{
          background:
            "linear-gradient(to right bottom, rgb(150, 200, 255), rgb(200, 100, 255))",
        }}
        tw="flex flex-col justify-center rounded-2xl p-4 shadow-2xl shadow-purple-600"
      >
        <div
          tw="flex flex-col rounded-2xl p-12"
          style={{
            border: "1px rgba(156,163,175,0.3)",
            background,
          }}
        >
          <p tw="font-bold text-6xl">{title}</p>
          <p
            tw="text-4xl"
            style={{
              color: mutedForeground,
            }}
          >
            {description}
          </p>
        </div>
      </div>

      <div tw="flex flex-row items-center mt-auto p-4">
        <svg
          fill="currentColor"
          height="60"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          width="60"
        >
          <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
          <path d="M5 3v4" />
          <path d="M19 17v4" />
          <path d="M3 5h4" />
          <path d="M17 19h4" />
        </svg>
        <p tw="font-bold ml-4 text-4xl">{mode.name}</p>
      </div>
    </div>
  );
}
