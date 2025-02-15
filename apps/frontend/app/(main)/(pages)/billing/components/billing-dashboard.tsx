"use client";
import React from "react";
import { SubscriptionCard } from "./subscription-card";
import CreditTracker from "./credits-tracker";

const BillingDashboard = () => {
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
      <div className="flex gap-5 p-6">
        <SubscriptionCard onPayment={handlePayment} tier="Free" products={dummyProducts} />
      </div>
      <CreditTracker tier="Free" credits={10} />
    </>
  );
};

export default BillingDashboard;
