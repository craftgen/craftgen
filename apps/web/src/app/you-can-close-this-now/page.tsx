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
    <div className="flex h-screen w-full flex-col items-center justify-center">
      <h1 className="py-4 text-4xl">Success !</h1>
      <p>This page will automatically close in {time} seconds.</p>
    </div>
  );
};

export default Page;
