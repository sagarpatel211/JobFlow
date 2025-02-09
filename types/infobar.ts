export interface PaymentDetails {
  tier: string;
  credits: number;
}

export interface HealthBarProps {
  value: number;
  maxValue: number;
  color: string;
}

export interface ProgressItem {
  label: string;
  value: number;
  setValue: React.Dispatch<React.SetStateAction<number>>;
  maxValue: number;
  color: string;
}
