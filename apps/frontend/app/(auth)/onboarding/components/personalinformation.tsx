"use client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import React from "react";

interface PersonalInformation {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  address: string;
}

interface PersonalInformationFormProps {
  formData: PersonalInformation;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function PersonalInformationForm({ formData, handleInputChange }: PersonalInformationFormProps) {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-3">Personal Information</h1>
      <div className="space-y-4">
        <div>
          <Label htmlFor="firstName">First Name</Label>
          <Input name="firstName" value={formData.firstName} onChange={handleInputChange} placeholder="First Name" />
        </div>
        <div>
          <Label htmlFor="lastName">Last Name</Label>
          <Input name="lastName" value={formData.lastName} onChange={handleInputChange} placeholder="Last Name" />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input name="email" value={formData.email} onChange={handleInputChange} placeholder="Email" type="email" />
        </div>
        <div>
          <Label htmlFor="phoneNumber">Phone Number</Label>
          <Input
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleInputChange}
            placeholder="Phone Number"
            type="tel"
          />
        </div>
        <div>
          <Label htmlFor="address">Address</Label>
          <Input name="address" value={formData.address} onChange={handleInputChange} placeholder="Address" />
        </div>
      </div>
    </div>
  );
}
