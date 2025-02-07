"use client";
import React, { useRef, useState, useEffect } from "react";
import { useScroll, useTransform, motion, MotionValue } from "framer-motion";

export const ContainerScroll = ({
  titleComponent,
  children,
}: {
  titleComponent: string | React.ReactNode;
  children: React.ReactNode;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerReady, setContainerReady] = useState(false);

  useEffect(() => {
    if (containerRef.current) {
      setContainerReady(true);
    }
  }, []);

  return (
    <div
      className="relative h-[60rem] md:h-[80rem] flex items-center justify-center p-2 md:p-20"
      ref={containerRef}
    >
      {containerReady && containerRef.current && (
        <ContainerContent
          containerRef={containerRef as React.RefObject<HTMLDivElement>}
          titleComponent={titleComponent}
        >
          {children}
        </ContainerContent>
      )}
    </div>
  );
};

const ContainerContent = ({
  containerRef,
  titleComponent,
  children,
}: {
  containerRef: React.RefObject<HTMLDivElement>;
  titleComponent: string | React.ReactNode;
  children: React.ReactNode;
}) => {
  const { scrollYProgress } = useScroll({
    target: containerRef,
  });

  const [isMobile, setIsMobile] = React.useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  const scaleDimensions = () => {
    return isMobile ? [0.7, 0.9] : [1.05, 1];
  };

  const rotate = useTransform(scrollYProgress, [0, 1], [20, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], scaleDimensions());
  const translate = useTransform(scrollYProgress, [0, 2], [0, -150]);

  return (
    <div
      className="py-10 md:py-40 w-full relative"
      style={{
        perspective: "1000px",
      }}
    >
      <Header translate={translate} titleComponent={titleComponent} />
      <Card rotate={rotate} translate={translate} scale={scale}>
        {children}
      </Card>
    </div>
  );
};

interface HeaderProps {
  translate: MotionValue<number>;
  titleComponent: string | React.ReactNode;
}

export const Header = ({ translate, titleComponent }: HeaderProps) => {
  return (
    <motion.div
      style={{
        translateY: translate,
      }}
      className="max-w-5xl mx-auto text-center"
    >
      {titleComponent}
    </motion.div>
  );
};

export const Card = ({
  rotate,
  scale,
  children,
}: {
  rotate: MotionValue<number>;
  scale: MotionValue<number>;
  translate: MotionValue<number>;
  children: React.ReactNode;
}) => {
  return (
    <motion.div
      style={{
        rotateX: rotate,
        scale,
        boxShadow: "0 0 #0000004d, 0 9px 20px #0000004a, 0 37px 37px #202020",
      }}
      className="max-w-5xl -mt-12 mx-auto h-[30rem] md:h-[40rem] w-full border-2 border-gray-950 p-2 md:p-6 rounded-[30px] shadow-2xl bg-gradient-to-b from-[#000000] to-[#030306]"
    >
      <div className="h-full w-full overflow-hidden rounded-2xl bg-gray-100 dark:bg-zinc-900 md:rounded-2xl">
        {children}
      </div>
    </motion.div>
  );
};
