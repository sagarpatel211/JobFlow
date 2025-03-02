"use client";
import { useState, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { AuroraBackground } from "@/components/ui/aurora-background";
import PersonalInformationForm from "./components/personalinformation";
import TrackingPreferencesForm from "./components/trackingpreferences";
import DocumentsForm from "./components/documentsform";
import JobAutomationForm from "./components/jobautomationform";
import FinalStepForm from "./components/finalstep";
import { motion, AnimatePresence } from "framer-motion";
import { MultiStepLoader as Loader } from "@/components/ui/multi-step-loader";

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  address: string;
  leetcodeEnabled: boolean;
  behaviouralEnabled: boolean;
  jobsEnabled: boolean;
  systemDesignEnabled: boolean;
  resume: File | null;
  coverLetter: File | null;
  transcript: File | null;
  latex: File | null;
  preferredJobTitles: string;
  preferredCompanies: string;
  autoApply: boolean;
  additionalNotes: string;
  termsAccepted: boolean;
}

const loadingStates = [
  { text: "Buying a condo" },
  { text: "Travelling in a flight" },
  { text: "Meeting Tyler Durden" },
  { text: "He makes soap" },
  { text: "We goto a bar" },
  { text: "Start a fight" },
  { text: "We like it" },
  { text: "Welcome to F**** C***" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<number>(1);
  const [direction, setDirection] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const totalSteps = 5;

  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    address: "",
    leetcodeEnabled: false,
    behaviouralEnabled: false,
    jobsEnabled: false,
    systemDesignEnabled: false,
    resume: null,
    coverLetter: null,
    transcript: null,
    latex: null,
    preferredJobTitles: "",
    preferredCompanies: "",
    autoApply: false,
    additionalNotes: "",
    termsAccepted: false,
  });

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (e.target instanceof HTMLInputElement && e.target.files && e.target.files.length > 0) {
      const file: File = e.target.files[0];
      setFormData((prev) => ({ ...prev, [name]: file }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  const isStepValid = (): boolean => {
    switch (step) {
      case 1:
        return (
          formData.firstName.trim() !== "" &&
          formData.lastName.trim() !== "" &&
          formData.email.trim() !== "" &&
          formData.phoneNumber.trim() !== "" &&
          formData.address.trim() !== ""
        );
      case 2:
        return true;
      case 3:
        return formData.resume !== null && formData.coverLetter !== null;
      case 4:
        return formData.preferredJobTitles.trim() !== "" && formData.preferredCompanies.trim() !== "";
      case 5:
        return formData.termsAccepted;
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (!isStepValid()) return;
    if (step < totalSteps) {
      setDirection(1);
      setStep(step + 1);
    } else {
      setIsSubmitting(true);
      console.log("Form submitted:", formData);
      setTimeout(() => {
        router.push("/dashboard");
      }, 10000);
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setDirection(-1);
      setStep(step - 1);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return <PersonalInformationForm formData={formData} handleInputChange={handleInputChange} />;
      case 2:
        return <TrackingPreferencesForm formData={formData} handleCheckboxChange={handleCheckboxChange} />;
      case 3:
        return (
          <DocumentsForm
            formData={formData}
            handleFileChange={(field: "resume" | "coverLetter" | "transcript" | "latex", file: File) => {
              setFormData((prev) => ({ ...prev, [field]: file }));
            }}
          />
        );
      case 4:
        return (
          <JobAutomationForm
            formData={formData}
            handleInputChange={handleInputChange}
            handleCheckboxChange={handleCheckboxChange}
          />
        );
      case 5:
        return <FinalStepForm formData={formData} handleCheckboxChange={handleCheckboxChange} />;
      default:
        return null;
    }
  };

  return (
    <>
      <AuroraBackground className="absolute inset-0 -z-10" />
      <div className="relative z-50 h-screen flex items-center justify-center">
        <div className="max-w-3xl w-full mx-auto rounded-none md:rounded-2xl p-4 md:p-8 shadow-input bg-white dark:bg-black h-[700px] flex flex-col">
          <h2 className="mb-4 text-sm font-medium text-neutral-800 dark:text-neutral-200">
            To use JobFlow, we need some information to optimize your experience.
          </h2>
          <div className="mb-6">
            <div className="flex justify-between items-center">
              <h1 className="text-xl font-bold text-neutral-800 dark:text-neutral-200">
                Step {step} of {totalSteps}
              </h1>
              <div className="text-sm text-neutral-600 dark:text-neutral-400">Onboarding Progress</div>
            </div>
            <div className="mt-2 w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2">
              <motion.div
                className="h-2 rounded-full"
                style={{ background: "linear-gradient(to right, #2563eb, #60a5fa)" }}
                animate={{ width: `${((step / totalSteps) * 100).toString()}%` }}
                transition={{ duration: 0.5 }}
              ></motion.div>
            </div>
          </div>
          <div className="flex-grow h-[500px] overflow-hidden relative">
            {isSubmitting ? (
              <motion.div
                className="absolute inset-0 flex items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <Loader loadingStates={loadingStates} loading={true} duration={2000} />
              </motion.div>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: direction > 0 ? 50 : -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: direction > 0 ? -50 : 50 }}
                  transition={{ duration: 0.3 }}
                  className="absolute inset-0"
                >
                  {renderStep()}
                </motion.div>
              </AnimatePresence>
            )}
          </div>
          {!isSubmitting && (
            <div className="flex justify-between mt-8">
              <Button variant="outline" onClick={prevStep} disabled={step === 1} className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
              <Button onClick={nextStep} disabled={!isStepValid()} className="flex items-center gap-2">
                {step === totalSteps ? "Complete" : "Next"} {step !== totalSteps && <ArrowRight className="h-4 w-4" />}
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
