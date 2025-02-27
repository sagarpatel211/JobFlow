import React from "react";

type Props = { children: React.ReactNode };

const Layout = ({ children }: Props) => {
  return <div className="h-screen overflow-scroll">{children}</div>;
};

export default Layout;
