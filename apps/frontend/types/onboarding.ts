// Add React import for ChangeEvent
import React from "react";

// Personal Information Types
export interface PersonalInformation {
  email: string;
  phoneNumber: string;
  address: string;
  university: string;
  aboutMe: string;
  openAIKey: string;
  archiveDuration: string;
  deleteDuration: string;
}

export interface PersonalInformationFormProps {
  formData: PersonalInformation;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleSelectChange: (field: keyof PersonalInformation, value: string) => void;
}

// Documents Form Types
export interface DocumentsFormProps {
  // current document URLs
  resumeUrl: string;
  coverLetterUrl: string;
  transcriptUrl: string;
  latexUrl: string;
  // callback when a document is uploaded: returns its storage URL
  handleFileChange: (field: "resumeUrl" | "coverLetterUrl" | "transcriptUrl" | "latexUrl", url: string) => void;
}

// Job Automation Form Types
export interface JobAutomationFormData {
  preferredJobTitles?: string;
  preferredCompanies?: string;
  autoApply?: boolean;
  additionalNotes?: string;
}

export interface JobAutomationFormProps {
  formData: JobAutomationFormData;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleCheckboxChange: (field: keyof JobAutomationFormData, checked: boolean) => void;
}

// Tracking Preferences Types
export interface TrackingPreferencesFormData {
  leetcodeEnabled: boolean;
  behaviouralEnabled: boolean;
  jobsEnabled: boolean;
  systemDesignEnabled: boolean;
  leetcodeGoal: string;
  behaviouralGoal: string;
  jobsGoal: string;
  systemDesignGoal: string;
}

export interface TrackingPreferencesFormProps {
  formData: TrackingPreferencesFormData;
  handleCheckboxChange: (field: keyof TrackingPreferencesFormData, value: boolean) => void;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export interface Option {
  name: keyof TrackingPreferencesFormData;
  label: string;
}

// Final Step Types
export interface FinalStepFormData {
  termsAccepted: boolean;
}

export interface FinalStepFormProps {
  formData: FinalStepFormData;
  handleCheckboxChange: (field: keyof FinalStepFormData, value: boolean) => void;
}
