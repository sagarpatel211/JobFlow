export interface PricingCardProps {
  title: string;
  price: string;
  description: string;
  features: string[];
  primaryAction: {
    label: string;
    path: string;
  };
  secondaryAction?: {
    label: string;
    path: string;
  };
}
