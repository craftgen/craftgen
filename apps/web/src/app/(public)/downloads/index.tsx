"use client";

import { useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { motion } from "framer-motion";
import { usePostHog } from "posthog-js/react";

import { Button } from "@craftgen/ui/components/button";

import {
  BASE_DL_LINK,
  Platform,
  platforms,
  useCurrentPlatform,
} from "./platform";

interface Props {
  latestVersion: string;
}

export function Downloads({ latestVersion }: Props) {
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(
    null,
  );
  const currentPlatform = useCurrentPlatform();
  const posthog = usePostHog();

  const [dockerDialogOpen, setDockerDialogOpen] = useState(false);

  const [formattedVersion, note] = (() => {
    const platform = selectedPlatform ?? currentPlatform;
    return platform
      ? [
          platform.version &&
            (platform.name === "Linux"
              ? platform.version
              : `${platform.name} ${platform.version}`),
          platform.note,
        ]
      : [];
  })();

  return (
    <>
      {/* <div className="flex flex-row gap-3">
				{currentPlatform &&
					(() => {
						const Icon = currentPlatform.icon;
						const { links } = currentPlatform;

						return (
							<HomeCTA
								href={
									links?.length === 1
										? `${BASE_DL_LINK}/${currentPlatform.os}/${links[0].arch}`
										: undefined
								}
								className={`z-5 relative`}
								icon={Icon ? <Icon width="1rem" height="1rem" /> : undefined}
								text={`Download for ${currentPlatform.name}`}
								onClick={() => {
									plausible('download', {
										props: { os: currentPlatform.name }
									});
									setSelectedPlatform(currentPlatform);
								}}
							/>
						);
					})()}

				<HomeCTA
					target="_blank"
					href="https://www.github.com/spacedriveapp/spacedrive"
					icon={<Github />}
					className="z-5 relative"
					text="Star on GitHub"
				/>
			</div> */}

      {selectedPlatform?.links && selectedPlatform.links.length > 1 && (
        <div className="z-50 mb-2 mt-4 flex flex-row gap-3 fade-in">
          {selectedPlatform.links.map(({ name, arch }) => (
            <Link href={`${BASE_DL_LINK}/${selectedPlatform.os}/${arch}`}>
              <Button
                key={name}
                rel="noopener"
                onClick={() => {
                  posthog.capture("download", {
                    props: { os: selectedPlatform.name + " " + arch },
                  });
                }}
                className="z-5 relative !py-1 !text-sm"
              >
                {name}
              </Button>
            </Link>
          ))}
        </div>
      )}
      <p className="animation-delay-3 z-30 mt-3 px-6 text-center text-sm text-gray-400 fade-in">
        {latestVersion}
        {formattedVersion && (
          <>
            <span className="mx-2 opacity-50">|</span>
            {formattedVersion}
          </>
        )}
        {note && (
          <>
            <span className="mx-2 opacity-50">|</span>
            {note}
          </>
        )}
      </p>
      {/* Platform icons */}
      <div className="relative z-10 mt-5 flex gap-3">
        {Object.values<Platform>(platforms).map((platform, i) => {
          return (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.2, ease: "easeInOut" }}
              key={platform.name}
            >
              <Platform
                key={platform.name}
                platform={platform}
                className={clsx(platform.name === "Docker" && "cursor-pointer")}
                onClick={() => {
                  if (platform.name === "Docker") {
                    setDockerDialogOpen(true);
                    return;
                  }
                  if (platform.links) {
                    if (platform.links.length === 1) {
                      posthog.capture("download", {
                        props: { os: platform.name },
                      });
                    } else {
                      setSelectedPlatform(platform);
                    }
                  }
                }}
              />
            </motion.div>
          );
        })}
      </div>
    </>
  );
}
