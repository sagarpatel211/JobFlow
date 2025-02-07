import { CardContainer } from "@/components/ui/3d-card";
import PricingCard from "@/components/ui/pricingcard";
import { BackgroundGradient } from "@/components/ui/background-gradient";

const Pricing = async () => {
  return (
    <div className="flex flex-wrap items-center justify-center flex-col md:flex-row gap-8 -mt-72 mb-10">
      <CardContainer className="dm-sans">
        <PricingCard
          title="Hobby"
          price="$0"
          description="Get a glimpse of what our software is capable of. Just a heads up you'll never leave us after this!"
          features={["3 Free automations", "100 tasks per month", "Two-step Actions"]}
          primaryAction={{ label: "Get Started Now", path: "/signin" }}
          secondaryAction={{ label: "Try now", path: "/dashboard" }}
        />
      </CardContainer>
      <BackgroundGradient>
        <CardContainer className="dm-sans">
          <PricingCard
            title="Pro Plan"
            price="$29"
            description="Get a glimpse of what our software is capable of. Just a heads up you'll never leave us after this!"
            features={["3 Free automations", "100 tasks per month", "Two-step Actions"]}
            primaryAction={{ label: "Get Started Now", path: "/signin" }}
            secondaryAction={{ label: "Try now", path: "/dashboard" }}
          />
        </CardContainer>
      </BackgroundGradient>
      <CardContainer className="dm-sans">
        <PricingCard
          title="Unlimited"
          price="$99"
          description="Get a glimpse of what our software is capable of. Just a heads up you'll never leave us after this!"
          features={["3 Free automations", "100 tasks per month", "Two-step Actions"]}
          primaryAction={{ label: "Get Started Now", path: "/signin" }}
          secondaryAction={{ label: "Try now", path: "/dashboard" }}
        />
      </CardContainer>
    </div>
  );
};

export default Pricing;
