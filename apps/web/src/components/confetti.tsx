"use client";

import { useState } from "react";
import Confetti from "react-dom-confetti";
import { useDebounce } from "react-use";

export function Confettis() {
  const [active, setActive] = useState(false);
  useDebounce(() => setActive(true), 200);

  const confetti = {
    spread: 70,
    startVelocity: 60,
    elementCount: 300,
    dragFriction: 0.07,
    duration: 7000,
    stagger: 2,
    width: "5px",
    height: "16px",
    perspective: "1200px",
    colors: ["#a864fd", "#29cdff", "#78ff44", "#ff718d", "#fdff6a"],
  };

  return (
    <>
      <span className="absolute bottom-0 left-0 z-20">
        <Confetti active={active} config={{ ...confetti, angle: 65 }} />
      </span>
      <span className="absolute bottom-0 right-0 z-20">
        <Confetti active={active} config={{ ...confetti, angle: 135 }} />
      </span>
    </>
  );
}
