"use client";
import React from "react";
import { SubscriptionCard } from "./subscription-card";
import CreditTracker from "./credits-tracker";
import ApplyDiscount from "./apply-discounts";
import toast, { Toaster } from 'react-hot-toast';
import { useTheme } from "next-themes";

const BillingDashboard = () => {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  
  const dummyProducts = [
    { id: "1", nickname: "Free" },
    { id: "2", nickname: "Pro" },
    { id: "3", nickname: "Unlimited" },
  ];

  const handlePayment = (productId: string) => {
    console.log("Initiating payment for product:", productId);
  };

  

  return (
    <>
      <Toaster
              toastOptions={{
                style: {
                  background: isDark ? "#333" : "#fff",
                  color: isDark ? "#fff" : "#000",
                },
              }}
            />
      <div className="flex gap-10 p-6 items-start">
        {/* Left column: Subscriptions */}
        <div className="w-2/3 flex flex-col gap-6">
          <SubscriptionCard onPayment={handlePayment} tier="Free" products={dummyProducts} />
        </div>
        {/* Right column: Credit Tracker and Apply Discount */}
        <div className="w-1/3 flex flex-col gap-6 h-full justify-center">
          <CreditTracker
            interviews={{ used: 0, max: 1 }}
            generations={{ used: 50, max: 100 }}
            aiApplier={{ used: 0, max: "Unlimited" }}
          />
          <ApplyDiscount />
        </div>
      </div>
    </>
  );
};

export default BillingDashboard;
