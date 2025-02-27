"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { ArrowLeft, ArrowRight, Check, User, Mail, Building, MapPin } from "lucide-react";
import { BackgroundGradientAnimation } from "@/components/ui/background-gradient-animation";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    role: "",
    company: "",
    companySize: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    bio: "",
    interests: [],
    notifications: false,
    termsAccepted: false,
  });

  const totalSteps = 4;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (name, checked) => {
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  const handleInterestToggle = (interest) => {
    setFormData((prev) => {
      const interests = [...prev.interests];
      if (interests.includes(interest)) {
        return { ...prev, interests: interests.filter((i) => i !== interest) };
      } else {
        return { ...prev, interests: [...interests, interest] };
      }
    });
  };

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const nextStep = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      // Submit the form or redirect
      console.log("Form submitted:", formData);
      router.push("/dashboard");
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const isStepValid = () => {
    switch (step) {
      case 1:
        return formData.firstName && formData.lastName && formData.email;
      case 2:
        return formData.role && formData.company;
      case 3:
        return formData.address && formData.city && formData.state && formData.zipCode;
      case 4:
        return formData.termsAccepted;
      default:
        return false;
    }
  };

  return (
    <>
      <BackgroundGradientAnimation className="fixed inset-0 -z-10" />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-3xl bg-card rounded-xl shadow-lg overflow-hidden">
          <div className="w-full bg-muted px-8 pt-8">
            <div className="flex justify-between mb-2">
              {Array.from({ length: totalSteps }).map((_, index) => (
                <div key={index} className="flex flex-col items-center">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium",
                      step > index + 1
                        ? "bg-primary text-primary-foreground"
                        : step === index + 1
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted-foreground/20 text-muted-foreground",
                    )}
                  >
                    {step > index + 1 ? <Check className="h-5 w-5" /> : index + 1}
                  </div>
                  <span className="text-xs mt-1 text-muted-foreground">
                    {index === 0 ? "Personal" : index === 1 ? "Professional" : index === 2 ? "Address" : "Finish"}
                  </span>
                </div>
              ))}
            </div>
            <div className="w-full bg-muted-foreground/20 h-2 rounded-full mb-6">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${(step / totalSteps) * 100}%` }}
              />
            </div>
          </div>

          <div className="p-8">
            {/* Step 1: Personal Information */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <h1 className="text-2xl font-bold">Personal Information</h1>
                  <p className="text-muted-foreground">Tell us a bit about yourself.</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <div className="relative">
                      <Input
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        placeholder="John"
                        className="pl-10"
                      />
                      <User className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      placeholder="Doe"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="john.doe@example.com"
                      className="pl-10"
                    />
                    <Mail className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Professional Information */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <h1 className="text-2xl font-bold">Professional Information</h1>
                  <p className="text-muted-foreground">Tell us about your work.</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Your Role</Label>
                  <Select onValueChange={(value) => handleSelectChange("role", value)} value={formData.role}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="developer">Developer</SelectItem>
                      <SelectItem value="designer">Designer</SelectItem>
                      <SelectItem value="product_manager">Product Manager</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company">Company Name</Label>
                  <div className="relative">
                    <Input
                      id="company"
                      name="company"
                      value={formData.company}
                      onChange={handleInputChange}
                      placeholder="Acme Inc."
                      className="pl-10"
                    />
                    <Building className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companySize">Company Size</Label>
                  <RadioGroup
                    value={formData.companySize}
                    onValueChange={(value) => handleSelectChange("companySize", value)}
                    className="grid grid-cols-2 gap-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="1-10" id="size-1" />
                      <Label htmlFor="size-1">1-10 employees</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="11-50" id="size-2" />
                      <Label htmlFor="size-2">11-50 employees</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="51-200" id="size-3" />
                      <Label htmlFor="size-3">51-200 employees</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="201+" id="size-4" />
                      <Label htmlFor="size-4">201+ employees</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            )}

            {/* Step 3: Address Information */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <h1 className="text-2xl font-bold">Address Information</h1>
                  <p className="text-muted-foreground">Where are you located?</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Street Address</Label>
                  <div className="relative">
                    <Input
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder="123 Main St"
                      className="pl-10"
                    />
                    <MapPin className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      placeholder="San Francisco"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Select onValueChange={(value) => handleSelectChange("state", value)} value={formData.state}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CA">California</SelectItem>
                        <SelectItem value="NY">New York</SelectItem>
                        <SelectItem value="TX">Texas</SelectItem>
                        <SelectItem value="FL">Florida</SelectItem>
                        <SelectItem value="IL">Illinois</SelectItem>
                        {/* Add more states as needed */}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="zipCode">Zip Code</Label>
                  <Input
                    id="zipCode"
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={handleInputChange}
                    placeholder="94103"
                  />
                </div>
              </div>
            )}

            {/* Step 4: Final Information */}
            {step === 4 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <h1 className="text-2xl font-bold">Almost Done!</h1>
                  <p className="text-muted-foreground">Just a few more details before we finish.</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    placeholder="Tell us a bit about yourself..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Interests</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {["Technology", "Design", "Marketing", "Business", "Education", "Health"].map((interest) => (
                      <div key={interest} className="flex items-center space-x-2">
                        <Checkbox
                          id={`interest-${interest}`}
                          checked={formData.interests.includes(interest)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              handleInterestToggle(interest);
                            } else {
                              handleInterestToggle(interest);
                            }
                          }}
                        />
                        <Label htmlFor={`interest-${interest}`}>{interest}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="notifications"
                      checked={formData.notifications}
                      onCheckedChange={(checked) => handleCheckboxChange("notifications", checked)}
                    />
                    <Label htmlFor="notifications">I want to receive notifications and updates</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="terms"
                      checked={formData.termsAccepted}
                      onCheckedChange={(checked) => handleCheckboxChange("termsAccepted", checked)}
                    />
                    <Label htmlFor="terms" className="text-sm">
                      I agree to the{" "}
                      <Link href="/terms" className="text-primary hover:underline">
                        Terms of Service
                      </Link>{" "}
                      and{" "}
                      <Link href="/privacy" className="text-primary hover:underline">
                        Privacy Policy
                      </Link>
                    </Label>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex justify-between mt-8">
              <Button variant="outline" onClick={prevStep} disabled={step === 1} className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
              <Button onClick={nextStep} disabled={!isStepValid()} className="flex items-center gap-2">
                {step === totalSteps ? "Complete" : "Next"} {step !== totalSteps && <ArrowRight className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
