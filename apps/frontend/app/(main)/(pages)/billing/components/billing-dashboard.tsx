"use client";
import React, { useState } from "react";
import { SubscriptionCard } from "./subscription-card";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";

const BillingDashboard = () => {
  const dummyProducts = [
    { id: "1", nickname: "Free" },
    { id: "2", nickname: "Pro" },
    { id: "3", nickname: "Unlimited" },
  ];

  const handlePayment = (productId: string) => {
    console.log("Initiating payment for product:", productId);
  };

  const [discountCode, setDiscountCode] = useState("");

  const applyDiscount = () => {
    toast.success("Discount applied successfully!");
  };

  return (
    <div className="flex gap-10 p-6 items-start">
      <div className="w-2/3 flex flex-col gap-6">
        <SubscriptionCard onPayment={handlePayment} tier="Free" products={dummyProducts} />
      </div>
      <div className="w-1/3 flex flex-col gap-6 h-full justify-center">
        <Card className="p-6 flex flex-col h-44 justify-between">
          <CardTitle className="font-light">Credit Tracker</CardTitle>
          <div className="flex items-center gap-4 mt-4 w-full">
            <div className="w-full h-6 bg-gray-200 rounded-full relative">
              <Progress
                value={10 * 10}
                className="absolute left-0 h-6 bg-gradient-to-r from-blue-500 to-green-400 rounded-full transition-all duration-500"
                style={{ width: `${10 * 10}%` }}
              />
            </div>
            <p className="text-center whitespace-nowrap">10/100</p>
          </div>
        </Card>
        <Card className="p-6 h-[200px] flex flex-col justify-between">
          <CardTitle className="font-light">Apply Discount</CardTitle>
          <div className="flex flex-col gap-4 mt-4">
            <Input
              type="text"
              placeholder="Enter discount code"
              value={discountCode}
              onChange={(e) => setDiscountCode(e.target.value)}
            />
            <Button onClick={applyDiscount}>Apply</Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default BillingDashboard;