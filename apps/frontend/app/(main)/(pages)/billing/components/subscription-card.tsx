"use client";
import React, { useState } from "react";
import { CardContainer } from "@/components/ui/3d-card";
import PricingCard from "@/components/landing/pricingcard";
import { BackgroundGradient } from "@/components/ui/background-gradient";

type Product = {
  id: string;
  nickname: string;
};

type Props = {
  onPayment: (id: string) => Promise<void>;
  products: Product[];
  tier: string;
};

export const SubscriptionCard = ({ onPayment, products, tier }: Props) => {
  const [loadingProduct, setLoadingProduct] = useState<string | null>(null);

  const handlePayment = async (id: string) => {
    setLoadingProduct(id);
    try {
      await onPayment(id);
    } finally {
      setLoadingProduct(null);
    }
  };

  return (
    <div className="flex items-center justify-center w-full gap-8 px-6">
      {products.map((product: Product, index) => (
        <div key={product.id} className="w-full md:w-1/3 flex justify-center p-4">
          {index === 1 ? (
            <BackgroundGradient>
              <CardContainer className="dm-sans w-full max-w-lg">
                <PricingCard
                  title={product.nickname}
                  price={product.nickname === "Free" ? "$0" : product.nickname === "Pro" ? "$29" : "$99"}
                  description={
                    product.nickname === "Unlimited"
                      ? "Enjoy a monthly torrent of credits flooding your account, empowering you to tackle even the most ambitious automation tasks effortlessly."
                      : product.nickname === "Pro"
                        ? "Experience a monthly surge of credits to supercharge your automation efforts. Ideal for small to medium-sized projects seeking consistent support."
                        : "Get a monthly wave of credits to automate your tasks with ease. Perfect for starters looking to dip their toes into Fuzzie's automation capabilities."
                  }
                  features={["3 Free automations", "100 tasks per month", "Two-step Actions"]}
                  primaryAction={{ label: "Get Started Now", path: "/signup" }}
                  secondaryAction={{ label: "Try now", path: "/signup" }}
                />
              </CardContainer>
            </BackgroundGradient>
          ) : (
            <CardContainer className="dm-sans w-full max-w-lg">
              <PricingCard
                title={product.nickname}
                price={product.nickname === "Free" ? "$0" : product.nickname === "Pro" ? "$29" : "$99"}
                description={
                  product.nickname === "Unlimited"
                    ? "Enjoy a monthly torrent of credits flooding your account, empowering you to tackle even the most ambitious automation tasks effortlessly."
                    : product.nickname === "Pro"
                      ? "Experience a monthly surge of credits to supercharge your automation efforts. Ideal for small to medium-sized projects seeking consistent support."
                      : "Get a monthly wave of credits to automate your tasks with ease. Perfect for starters looking to dip their toes into Fuzzie's automation capabilities."
                }
                features={["3 Free automations", "100 tasks per month", "Two-step Actions"]}
                primaryAction={{ label: "Get Started Now", path: "/signup" }}
                secondaryAction={{ label: "Try now", path: "/signup" }}
              />
            </CardContainer>
          )}
        </div>
      ))}
    </div>
  );
};
