// Personal Information Types
export interface PersonalInformation {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  address: string;
}

export interface PersonalInformationFormProps {
  formData: PersonalInformation;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

// Documents Form Types
export interface DocumentsFormProps {
  formData?: {
    resume: File | null;
    coverLetter: File | null;
    transcript: File | null;
    latex: File | null;
  };
  handleFileChange: (field: "resume" | "coverLetter" | "transcript" | "latex", file: File) => void;
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
}

export interface TrackingPreferencesFormProps {
  formData: TrackingPreferencesFormData;
  handleCheckboxChange: (field: keyof TrackingPreferencesFormData, value: boolean) => void;
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
