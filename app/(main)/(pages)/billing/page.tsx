// import React from "react";

// const BillingPage = () => {
//   return (
//     <div className="flex flex-col gap-4 relative">
//       <h1 className="text-4xl sticky top-0 z-[10] p-6 bg-background/50 backdrop-blur-lg flex items-center border-b">
//         Billing
//       </h1>
//     </div>
//   );
// };

// export default BillingPage;

import React from "react";
// import Stripe from 'stripe'
// import { db } from '@/lib/db'
import BillingDashboard from "./components/billing-dashboard";

type Props = {
  searchParams?: { [key: string]: string | undefined };
};

const Billing = async (props: Props) => {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="sticky top-0 z-[10] flex items-center justify-between border-b bg-background/50 p-6 text-4xl backdrop-blur-lg">
        <span>Billing</span>
      </h1>
      <BillingDashboard />
    </div>
  );
};

export default Billing;
