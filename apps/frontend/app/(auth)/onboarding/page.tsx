"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, ArrowRight, Check, User, Mail, Building, Phone, MapPin } from "lucide-react";
import { BackgroundGradientAnimation } from "@/components/ui/background-gradient-animation";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const totalSteps = 4;

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    university: "",
    phoneNumber: "",
    address: "",
    archiveDuration: "A Month",
    leetcodeEnabled: false,
    behaviouralEnabled: false,
    jobsEnabled: false,
    systemDesignEnabled: false,
    termsAccepted: false,
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (name, checked) => {
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  const nextStep = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      console.log("Form submitted:", formData);
      router.push("/dashboard");
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  return (
    <>
      <BackgroundGradientAnimation className="fixed inset-0 -z-10" />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-3xl bg-card rounded-xl shadow-lg overflow-hidden p-8">
          {step === 1 && (
            <>
              <h1 className="text-2xl font-bold">Personal Information</h1>
              <Input name="university" value={formData.university} onChange={handleInputChange} placeholder="University" />
              <Input name="phoneNumber" value={formData.phoneNumber} onChange={handleInputChange} placeholder="Phone Number" type="tel" />
              <Textarea name="address" value={formData.address} onChange={handleInputChange} placeholder="Address" />
            </>
          )}

          {step === 2 && (
            <>
              <h1 className="text-2xl font-bold">Archive Settings</h1>
              <Select value={formData.archiveDuration} onValueChange={(value) => setFormData({ ...formData, archiveDuration: value })}>
                <SelectTrigger className="w-full mt-1">
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  {["2 Weeks", "A Month", "3 Months", "A Year", "Never"].map((duration) => (
                    <SelectItem key={duration} value={duration}>{duration}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          )}

          {step === 3 && (
            <>
              <h1 className="text-2xl font-bold">Tracking Preferences</h1>
              {["leetcodeEnabled", "behaviouralEnabled", "jobsEnabled", "systemDesignEnabled"].map((option) => (
                <div key={option} className="flex items-center space-x-2">
                  <Checkbox id={option} checked={formData[option]} onCheckedChange={(checked) => handleCheckboxChange(option, checked)} />
                  <Label htmlFor={option}>
                    {option.replace("Enabled", "").replace(/([A-Z])/g, " $1").trim()}
                  </Label>
                </div>
              ))}
            </>
          )}

          {step === 4 && (
            <>
              <h1 className="text-2xl font-bold">Final Step</h1>
              <div className="flex items-center space-x-2">
                <Checkbox id="terms" checked={formData.termsAccepted} onCheckedChange={(checked) => handleCheckboxChange("termsAccepted", checked)} />
                <Label htmlFor="terms">
                  I agree to the <Link href="/terms" className="text-primary hover:underline">Terms</Link> and <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
                </Label>
              </div>
            </>
          )}

          <div className="flex justify-between mt-8">
            <Button variant="outline" onClick={prevStep} disabled={step === 1} className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            <Button onClick={nextStep} disabled={step === totalSteps && !formData.termsAccepted} className="flex items-center gap-2">
              {step === totalSteps ? "Complete" : "Next"} {step !== totalSteps && <ArrowRight className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
