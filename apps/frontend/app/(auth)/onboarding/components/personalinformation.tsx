"use client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import React from "react";
import { PersonalInformationFormProps } from "@/types/onboarding";

export default function PersonalInformationForm({
  formData,
  handleInputChange,
  handleSelectChange,
}: PersonalInformationFormProps) {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-3">Personal Information</h1>
      <div className="space-y-4 overflow-y-auto max-h-[400px] scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200">
        <div>
          <Label htmlFor="email">Preferred Email (will be used in cover letters)</Label>
          <Input name="email" value={formData.email} onChange={handleInputChange} placeholder="Preferred Email" type="email" />
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
          <Textarea name="address" value={formData.address} onChange={handleInputChange} placeholder="Address" />
        </div>
        <div>
          <Label htmlFor="university">University</Label>
          <Input name="university" value={formData.university} onChange={handleInputChange} placeholder="University" />
        </div>
        <div>
          <Label htmlFor="aboutMe">About Me</Label>
          <Textarea name="aboutMe" value={formData.aboutMe} onChange={handleInputChange} placeholder="About Me" />
        </div>
        <div>
          <Label htmlFor="openAIKey">OpenAI API Key</Label>
          <Input name="openAIKey" value={formData.openAIKey} onChange={handleInputChange} placeholder="OpenAI API Key" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="archiveDuration">Automatically Archive Unapplied Jobs</Label>
            <Select value={formData.archiveDuration} onValueChange={(v) => handleSelectChange("archiveDuration", v)}>
              <SelectTrigger className="w-full mt-1">
                <SelectValue placeholder="Select duration" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2 Weeks">2 Weeks</SelectItem>
                <SelectItem value="A Month">A Month</SelectItem>
                <SelectItem value="3 Months">3 Months</SelectItem>
                <SelectItem value="A Year">A Year</SelectItem>
                <SelectItem value="Never">Never</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="deleteDuration">Automatically Delete Unapplied Jobs</Label>
            <Select value={formData.deleteDuration} onValueChange={(v) => handleSelectChange("deleteDuration", v)}>
              <SelectTrigger className="w-full mt-1">
                <SelectValue placeholder="Select duration" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2 Weeks">2 Weeks</SelectItem>
                <SelectItem value="A Month">A Month</SelectItem>
                <SelectItem value="3 Months">3 Months</SelectItem>
                <SelectItem value="A Year">A Year</SelectItem>
                <SelectItem value="Never">Never</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
}
