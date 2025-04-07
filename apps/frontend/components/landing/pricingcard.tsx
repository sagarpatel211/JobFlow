"use client";
import { useRouter } from "next/navigation";
import { CardBody, CardItem } from "@/components/ui/3d-card";
import { CheckIcon } from "lucide-react";
import { PricingCardProps } from "@/types/pricing";

const PricingCard = ({
  title,
  price,
  description,
  features,
  primaryAction,
  secondaryAction,
  active,
}: PricingCardProps & { active?: boolean }) => {
  const router = useRouter();
  return (
    <CardBody className="bg-gray-50 relative group/card dark:hover:shadow-2xl dark:hover:shadow-neutral-500/[0.1] dark:bg-black dark:border-white/[0.2] border-black/[0.1] w-full md:!w-[350px] h-auto rounded-3xl p-6 border">
      <CardItem translateZ="50" className="text-xl font-bold text-neutral-600 dark:text-white">
        {title}
        <h2 className="text-6xl">{price}</h2>
      </CardItem>
      <CardItem translateZ="60" className="text-neutral-500 text-sm max-w-sm mt-2 dark:text-neutral-300">
        {description}
        <ul className="my-4 flex flex-col gap-2">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center gap-2">
              <CheckIcon />
              {feature}
            </li>
          ))}
        </ul>
      </CardItem>

      {(primaryAction || secondaryAction) && (
        <div className="flex justify-between items-center mt-8">
          {secondaryAction && (
            <button
              onClick={() => router.push(secondaryAction.path)}
              className="px-4 py-2 rounded-xl text-xs font-normal dark:text-white"
            >
              {secondaryAction.label} →
            </button>
          )}
          {primaryAction && (
            <button
              onClick={() => {
                if (!active) router.push(primaryAction.path);
              }}
              disabled={active}
              className={`px-4 py-2 rounded-xl text-xs font-bold ${
                active
                  ? "bg-gray-400 dark:bg-gray-600 text-white cursor-not-allowed"
                  : "bg-black dark:bg-white dark:text-black text-white"
              }`}
            >
              {active ? "Active Plan" : primaryAction.label}
            </button>
          )}
        </div>
      )}
    </CardBody>
  );
};

export default PricingCard;
