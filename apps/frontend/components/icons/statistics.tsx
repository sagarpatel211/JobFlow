import clsx from "clsx";
import React from "react";

type Props = { selected: boolean };

const Statistics = ({ selected }: Props) => {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect
        x="3"
        y="12"
        width="4.5"
        height="8"
        rx="1.5"
        className={clsx("transition-all dark:fill-[#353346] fill-[#BABABB] group-hover:fill-[#C8C7FF]", {
          "dark:!fill-[#C8C7FF] fill-[#C8C7FF]": selected,
        })}
      />
      <rect
        x="8"
        y="9"
        width="4.5"
        height="11"
        rx="1.5"
        className={clsx("transition-all dark:fill-[#353346] fill-[#BABABB] group-hover:fill-[#C8C7FF]", {
          "dark:!fill-[#C8C7FF] fill-[#C8C7FF]": selected,
        })}
      />
      <rect
        x="13"
        y="6"
        width="4.5"
        height="14"
        rx="1.5"
        className={clsx("transition-all dark:fill-[#353346] fill-[#BABABB] group-hover:fill-[#C8C7FF]", {
          "dark:!fill-[#C8C7FF] fill-[#C8C7FF]": selected,
        })}
      />
      <rect
        x="18"
        y="3"
        width="4.5"
        height="17"
        rx="1.5"
        className={clsx("transition-all dark:fill-[#353346] fill-[#BABABB] group-hover:fill-[#C8C7FF]", {
          "dark:!fill-[#C8C7FF] fill-[#C8C7FF]": selected,
        })}
      />
      <path
        d="M4 19L10 12L15 15L22 6"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={clsx("transition-all dark:stroke-[#C0BFC4] stroke-[#5B5966] group-hover:stroke-[#9F54FF]", {
          "dark:!stroke-[#7540A9] stroke-[#9F54FF]": selected,
        })}
      />
    </svg>
  );
};

export default Statistics;
