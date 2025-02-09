import { MotionValue } from "framer-motion";

export interface HeaderProps {
  translate: MotionValue<number>;
  titleComponent: string | React.ReactNode;
}

export interface Feature {
  title: string;
  link: string;
  thumbnail: string;
}
