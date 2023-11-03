"use client";

import React, { useRef, useState } from "react";
import { motion, spring } from "framer-motion";
import { useMouse } from "react-use";

import { Waitlist } from "./waitlist/waitlist";

export const Hero = () => {
  const ref = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLAnchorElement>(null);
  const buttonMouse = useMouse(buttonRef);
  const mouse = useMouse(ref);
  const [onButton, setOnButton] = useState(false);
  const [cursorVariant, setCursorVariant] = useState("default");

  const dx = buttonMouse.posX + buttonMouse.elW / 2 - buttonMouse.docX;
  const dy = buttonMouse.posY + buttonMouse.elH / 2 - buttonMouse.docY;
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI || 70;

  let mouseXPosition = 10;
  let mouseYPosition = 0;

  if (mouse.docX !== null) {
    mouseXPosition = mouse.elX;
  }

  if (mouse.docY !== null) {
    mouseYPosition = mouse.elY - 100;
  }
  const variants = {
    default: {
      opacity: 1,
      // height: 10,
      // width: 10,
      fontSize: "16px",
      // backgroundColor: "#1e91d6",
      x: mouseXPosition,
      y: mouseYPosition,
      transition: {
        type: "spring",
        mass: 0.6,
      },
    },
    project: {
      opacity: 1,
      // backgroundColor: "rgba(255, 255, 255, 0.6)",
      backgroundColor: "#fff",
      color: "#000",
      height: 80,
      width: 80,
      fontSize: "18px",
      x: mouseXPosition - 32,
      y: mouseYPosition - 32,
    },
    contact: {
      opacity: 1,
      backgroundColor: "#FFBCBC",
      color: "#000",
      height: 64,
      width: 64,
      fontSize: "32px",
      x: mouseXPosition - 48,
      y: mouseYPosition - 48,
    },
  };

  return (
    <section className="relative py-12 sm:py-16 lg:pb-40" ref={ref}>
      <motion.div
        variants={variants}
        initial={{
          y: -100,
          x: 50,
        }}
        className="text-primary pointer-events-none absolute z-50 flex items-center rounded bg-transparent p-4"
        animate={cursorVariant}
        transition={spring}
      >
        {onButton ? (
          <div className="text-2xl font-bold">YES!</div>
        ) : (
          <>
            <motion.div
              className="text-4xl"
              style={{ transform: `rotate(${angle}deg)` }}
              transition={{
                type: "spring",
                stiffness: 260,
                damping: 20,
              }}
            >
              👉
            </motion.div>
            <div className="text-foreground font-bold">JOIN WAITLIST</div>
          </>
        )}
      </motion.div>
      <div className="absolute bottom-0 right-0 overflow-hidden">
        <img
          className="h-auto w-full origin-bottom-right scale-150 transform lg:mx-auto lg:w-auto lg:scale-75 lg:object-cover"
          src="https://cdn.rareblocks.xyz/collection/clarity/images/hero/1/background-pattern.png"
          alt=""
        />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-y-4 lg:grid-cols-2 lg:items-center xl:grid-cols-2">
          <div className="text-center md:px-16 lg:px-0 lg:text-left xl:col-span-1 xl:pr-20">
            <h1 className="font-pj text-4xl font-bold  leading-tight sm:text-5xl sm:leading-tight lg:text-6xl lg:leading-tight">
              Craft{" "}
              <span className="cursor-pointer hover:text-red-600">SEO</span>{" "}
              content on autopilot.
            </h1>
            <p className="text-muted-foreground font-inter mt-2 text-lg sm:mt-6">
              The ultimate playground for prompt engineers. Craft multi-model AI
              workflows and set your content generation on autopilot.
            </p>

            <Waitlist>
              <a
                ref={buttonRef}
                href="#"
                onMouseOver={() => setOnButton(true)}
                onMouseOut={() => setOnButton(false)}
                title=""
                role="button"
                className="2.3s dark:join-waitlist-button mt-8 inline-flex cursor-pointer select-none rounded bg-gray-900 px-8 py-4 text-lg font-bold text-white transition-all duration-150 ease-in-out hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 active:scale-90 sm:mt-10"
              >
                Join the waitlist for early access
              </a>
            </Waitlist>
            <div className="mt-8 sm:mt-16">
              <div className="flex items-center justify-center lg:justify-start">
                <svg
                  className="h-5 w-5 text-[#FDB241]"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <svg
                  className="h-5 w-5 text-[#FDB241]"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <svg
                  className="h-5 w-5 text-[#FDB241]"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <svg
                  className="h-5 w-5 text-[#FDB241]"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <svg
                  className="h-5 w-5 text-[#FDB241]"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>

              <blockquote className="mt-6">
                <p className="text-foreground font-pj text-lg font-bold">
                  Best way to work with AI to automate content!
                </p>
                <p className="font-inter mt-3 text-base leading-7 text-gray-600">
                  SEOcraft&apos;s playground brilliantly counters chatbot
                  limitations. It empowers users with a nuanced toolset,
                  elevating AI from an &apos;operated machine&apos; to a
                  collaboratively designed masterpiece.
                </p>
              </blockquote>

              <div className="mt-3 flex items-center justify-center lg:justify-start">
                <img
                  className="h-6 w-6 flex-shrink-0 overflow-hidden rounded-full object-cover"
                  src="https://cdn.rareblocks.xyz/collection/clarity/images/hero/1/avatar-female.png"
                  alt=""
                />
                <p className="font-pj ml-2 text-base  font-bold">
                  (You in the future)
                </p>
              </div>
            </div>
          </div>

          <div className="xl:col-span-1">
            <img
              className="mx-auto w-full"
              src="https://cdn.rareblocks.xyz/collection/clarity/images/hero/1/illustration.png"
              alt=""
            />
          </div>
        </div>
      </div>
    </section>
  );
};
export default Hero;
