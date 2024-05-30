"use client";

import Joyride from "react-joyride";

const steps = [
  {
    target: "#create-playground-button",
    content: "This is my awesome feature!",
  },
  // {
  //   target: ".my-other-step",
  //   content: "This another awesome feature!",
  // },
];

export const Onboarding = () => {
  return (
    <>
      <Joyride steps={steps} />{" "}
    </>
  );
};
