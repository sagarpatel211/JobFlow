import React, { useState } from "react";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";

type Props = {
  credits: number;
  tier: string;
};

const CreditTracker = ({ credits, tier }: Props) => {
  const [discountCode, setDiscountCode] = useState("");

  const applyDiscount = () => {
    toast.success("Discount applied successfully!");
  };

  return (
    <div className="flex gap-6 p-6">
      <div className="flex flex-col w-2/3">
        <Card className="p-6">
          <CardContent className="flex flex-col gap-6">
            <CardTitle className="font-light">Credit Tracker</CardTitle>
            <div className="h-64 w-4 bg-gray-200 rounded-full relative">
              <Progress
                value={tier === "Free" ? credits * 10 : tier === "Unlimited" ? 100 : credits}
                className="absolute bottom-0 w-4 bg-blue-500 rounded-full transition-all duration-500"
                style={{ height: `${tier === "Free" ? credits * 10 : tier === "Unlimited" ? 100 : credits}%` }}
              />
            </div>
            <div className="mt-4">
              <p className="text-center">
                {credits}/{tier === "Free" ? 10 : tier === "Pro" ? 100 : "Unlimited"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="w-1/3 flex flex-col gap-4">
        <Card className="p-6">
          <CardContent>
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreditTracker;
