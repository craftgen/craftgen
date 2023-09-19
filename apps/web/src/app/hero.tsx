"use client";

import React, { useRef, useState } from "react";
import { Waitlist } from "./waitlist/waitlist";
import { useMouse } from "react-use";
import { motion, spring } from "framer-motion";

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
        className="p-4 rounded absolute z-50 text-primary bg-transparent flex items-center pointer-events-none"
        animate={cursorVariant}
        transition={spring}
      >
        {onButton ? (
          <div className="font-bold text-2xl">YES!</div>
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
          className="w-full h-auto origin-bottom-right transform scale-150 lg:w-auto lg:mx-auto lg:object-cover lg:scale-75"
          src="https://cdn.rareblocks.xyz/collection/clarity/images/hero/1/background-pattern.png"
          alt=""
        />
      </div>

      <div className="relative px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-y-4 lg:items-center lg:grid-cols-2 xl:grid-cols-2">
          <div className="text-center xl:col-span-1 lg:text-left md:px-16 lg:px-0 xl:pr-20">
            <h1 className="text-4xl font-bold leading-tight  sm:text-5xl sm:leading-tight lg:text-6xl lg:leading-tight font-pj">
              Craft{" "}
              <span className="hover:text-red-600 cursor-pointer">SEO</span>{" "}
              content on autopilot.
            </h1>
            <p className="mt-2 text-lg text-muted-foreground sm:mt-6 font-inter">
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
                className="inline-flex px-8 py-4 mt-8 sm:mt-10 text-lg font-bold text-white cursor-pointer hover:scale-105 active:scale-90 transition-all duration-150 select-none rounded 2.3s ease-in-out bg-gray-900 dark:join-waitlist-button focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Join the waitlist for early access
              </a>
            </Waitlist>
            <div className="mt-8 sm:mt-16">
              <div className="flex items-center justify-center lg:justify-start">
                <svg
                  className="w-5 h-5 text-[#FDB241]"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <svg
                  className="w-5 h-5 text-[#FDB241]"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <svg
                  className="w-5 h-5 text-[#FDB241]"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <svg
                  className="w-5 h-5 text-[#FDB241]"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <svg
                  className="w-5 h-5 text-[#FDB241]"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>

              <blockquote className="mt-6">
                <p className="text-lg font-bold text-foreground font-pj">
                  Best way to work with AI to automate content!
                </p>
                <p className="mt-3 text-base leading-7 text-gray-600 font-inter">
                  SEOcraft&apos;s playground brilliantly counters chatbot
                  limitations. It empowers users with a nuanced toolset,
                  elevating AI from an &apos;operated machine&apos; to a
                  collaboratively designed masterpiece.
                </p>
              </blockquote>

              <div className="flex items-center justify-center mt-3 lg:justify-start">
                <img
                  className="flex-shrink-0 object-cover w-6 h-6 overflow-hidden rounded-full"
                  src="https://cdn.rareblocks.xyz/collection/clarity/images/hero/1/avatar-female.png"
                  alt=""
                />
                <p className="ml-2 text-base font-bold  font-pj">
                  (You in the future)
                </p>
              </div>
            </div>
          </div>

          <div className="xl:col-span-1">
            <img
              className="w-full mx-auto"
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
