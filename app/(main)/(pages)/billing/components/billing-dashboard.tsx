"use client";
import axios from "axios";
import React, { useEffect, useState } from "react";
import { SubscriptionCard } from "./subscription-card";
import CreditTracker from "./credits-tracker";

type Props = {};

const BillingDashboard = (props: Props) => {
  const [stripeProducts, setStripeProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Dummy data for subscription products (replace with API data as needed)
  const dummyProducts = [
    { id: "1", nickname: "Free" },
    { id: "2", nickname: "Pro" },
    { id: "3", nickname: "Unlimited" },
  ];

  const handlePayment = (productId: string) => {
    console.log("Initiating payment for product:", productId);
    // Add payment processing logic here
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
