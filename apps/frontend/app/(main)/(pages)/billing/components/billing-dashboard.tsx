"use client";
import React, { useState } from "react";
import { SubscriptionCard } from "./subscription-card";
import CreditTracker from "./credits-tracker";
import ApplyDiscount from "./apply-discounts";
import { Toaster } from "react-hot-toast";
import { useTheme } from "next-themes";
import { loadStripe } from "@stripe/stripe-js";
import { toast } from "react-hot-toast";

// base API URL, defaults to empty string if undefined
const apiBase: string = process.env.NEXT_PUBLIC_API_URL ?? "";

const BillingDashboard = () => {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const dummyProducts = [
    { id: "1", nickname: "Free" },
    { id: "2", nickname: "Pro" },
    { id: "3", nickname: "Unlimited" },
  ];

  // track which subscription tier is currently active
  const [activeTier, setActiveTier] = useState<string>(dummyProducts[0].nickname);

  // initialize Stripe.js
  const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "");

  // call backend to create a Checkout Session and return the session ID
  const createCheckoutSession = async (priceId: string): Promise<string> => {
    const apiUrl = `${apiBase}/api/billing/create-checkout-session`;
    const token = localStorage.getItem("access_token");
    const res = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ priceId }),
    });
    if (!res.ok) {
      const msg = await res.text();
      throw new Error(msg || "Failed to create checkout session.");
    }
    // parse JSON with explicit type to avoid unsafe any
    const data = (await res.json()) as { sessionId: string };
    return data.sessionId;
  };

  // wrapper to create Stripe session, redirect, and then locally set the active tier
  const handlePaymentAndSelect = async (productId: string): Promise<void> => {
    try {
      const sessionId = await createCheckoutSession(productId);
      const stripe = await stripePromise;
      if (!stripe) {
        toast.error("Stripe failed to initialize.");
        return;
      }
      const { error } = await stripe.redirectToCheckout({ sessionId });
      if (error) {
        const msg = error.message ?? "Checkout failed.";
        toast.error(msg);
      }
    } catch (error: unknown) {
      // narrow unknown error to string message
      let msg: string;
      if (error instanceof Error) {
        msg = error.message;
      } else {
        msg = String(error);
      }
      toast.error(msg);
      return;
    }
    // locally mark the selected tier active
    const product = dummyProducts.find((p) => p.id === productId);
    if (product) setActiveTier(product.nickname);
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
        <div className="w-2/3 flex flex-col gap-6">
          <SubscriptionCard onPayment={handlePaymentAndSelect} tier={activeTier} products={dummyProducts} />
        </div>
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
