"use client";
import React, { useState } from "react";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";

const ApplyDiscount = () => {
  const [discountCode, setDiscountCode] = useState("");
  const [loading, setLoading] = useState(false);

  const applyDiscount = async () => {
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    if (Math.random() < 0.5) {
      toast.success("Discount applied successfully!");
    } else {
      toast.error("Discount code is invalid!");
    }
    setLoading(false);
  };

  return (
    <Card className="p-6 h-[170px] flex flex-col justify-between">
      <CardTitle className="font-light">Apply Discount</CardTitle>
      <CardContent className="mt-4">
        <div className="flex items-center gap-2">
          <Input
            type="text"
            placeholder="Enter discount code"
            value={discountCode}
            onChange={(e) => setDiscountCode(e.target.value)}
            className="flex-1"
            disabled={loading}
          />
          <Button
            onClick={() => void applyDiscount()}
            disabled={!discountCode || loading}
            className="bg-purple-500 hover:bg-purple-600 dark:bg-purple-600 dark:hover:bg-purple-700 text-white flex items-center gap-2"
          >
            {loading ? <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div> : "Apply"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ApplyDiscount;
