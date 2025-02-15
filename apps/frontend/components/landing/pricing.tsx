import { CardContainer } from "@/components/ui/3d-card";
import PricingCard from "@/components/landing/pricingcard";
import { BackgroundGradient } from "@/components/ui/background-gradient";

const Pricing = () => {
  return (
    <div className="flex flex-wrap items-center justify-center flex-col md:flex-row gap-8 -mt-72 mb-10">
      <CardContainer className="dm-sans">
        <PricingCard
          title="Basic"
          price="$0"
          description="Get a glimpse of what our software is capable of. Just a heads up you'll never leave us after this!"
          features={["3 Free automations", "100 tasks per month", "Two-step Actions"]}
          primaryAction={{ label: "Get Started Now", path: "/signup" }}
          secondaryAction={{ label: "Try now", path: "/signup" }}
        />
      </CardContainer>
      <BackgroundGradient>
        <CardContainer className="dm-sans">
          <PricingCard
            title="Pro Plan"
            price="$29"
            description="Get a glimpse of what our software is capable of. Just a heads up you'll never leave us after this!"
            features={["3 Free automations", "100 tasks per month", "Two-step Actions"]}
            primaryAction={{ label: "Get Started Now", path: "/signup" }}
            secondaryAction={{ label: "Try now", path: "/signup" }}
          />
        </CardContainer>
      </BackgroundGradient>
      <CardContainer className="dm-sans">
        <PricingCard
          title="Ultimate Plan"
          price="$99"
          description="Get a glimpse of what our software is capable of. Just a heads up you'll never leave us after this!"
          features={["3 Free automations", "100 tasks per month", "Two-step Actions"]}
          primaryAction={{ label: "Get Started Now", path: "/signup" }}
          secondaryAction={{ label: "Try now", path: "/signup" }}
        />
      </CardContainer>
    </div>
  );
};

export default Pricing;
