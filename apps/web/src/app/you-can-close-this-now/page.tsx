"use client";

import { useEffect, useState } from "react";

const Page = () => {
  const [time, setTime] = useState(5);
  useEffect(() => {
    const interval = setInterval(() => {
      setTime((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);
  useEffect(() => {
    // if (typeof window !== "undefined") {
    // browser code
    if (time === 0) {
      window.close();
    }
    // }
  }, [time]);
  return (
    <div className="flex items-center justify-center w-full h-screen flex-col">
      <h1 className="text-4xl py-4">Success !</h1>
      <p>This page will automatically close in {time} seconds.</p>
    </div>
  );
};

export default Page;
