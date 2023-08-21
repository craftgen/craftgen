import { PropsWithChildren } from "react";

export const Scene: React.FC<PropsWithChildren> = ({ children }) => {
  return <div className="min-h-screen">{children}</div>;
};
