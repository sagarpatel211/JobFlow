"use client";
import { useState, ChangeEvent, useEffect } from "react";
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
import { getProfile, saveOnboard } from "../services/api";
import type { Profile } from "../services/api";
import React from "react";

interface FormData {
  email: string;
  phoneNumber: string;
  address: string;
  university: string;
  aboutMe: string;
  openAIKey: string;
  archiveDuration: string;
  deleteDuration: string;
  leetcodeEnabled: boolean;
  leetcodeGoal: string;
  behaviouralEnabled: boolean;
  behaviouralGoal: string;
  jobsEnabled: boolean;
  jobsGoal: string;
  systemDesignEnabled: boolean;
  systemDesignGoal: string;
  resumeUrl: string;
  coverLetterUrl: string;
  transcriptUrl: string;
  latexUrl: string;
  preferredJobTitles: string;
  preferredCompanies: string;
  autoApply: boolean;
  additionalNotes: string;
  termsAccepted: boolean;
}

const loadingStates = [
  { text: "Setting up your account" },
  { text: "Setting personal information" },
  { text: "Setting tracking preferences" },
  { text: "Uploading documents" },
  { text: "Welcome to JobFlow" },
];

export default function OnboardingPage() {
  const router = useRouter();
  // track current step (defaults to 1)
  const [step, setStep] = useState<number>(1);
  const [direction, setDirection] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  // prevent initial flash until we fetch the real step
  const [profileLoaded, setProfileLoaded] = useState<boolean>(false);
  const totalSteps = 5;

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profile: Profile = await getProfile();
        console.log("Onboarding GET profile:", profile);
        setFormData((prev) => ({
          ...prev,
          email: profile.preferredEmail ?? profile.email,
          phoneNumber: profile.phoneNumber || "",
          address: profile.address || "",
          university: profile.university || "",
          aboutMe: profile.aboutMe || "",
          openAIKey: profile.openAIKey || "",
          archiveDuration: profile.archiveDuration,
          deleteDuration: profile.deleteDuration,
          leetcodeEnabled: profile.leetcodeEnabled,
          leetcodeGoal: profile.leetcodeGoal.toString(),
          behaviouralEnabled: profile.behaviouralEnabled,
          behaviouralGoal: profile.behaviouralGoal.toString(),
          jobsEnabled: profile.jobsEnabled,
          jobsGoal: profile.jobsGoal.toString(),
          systemDesignEnabled: profile.systemDesignEnabled,
          systemDesignGoal: profile.systemDesignGoal.toString(),
          resumeUrl: profile.resumeUrl || "",
          coverLetterUrl: profile.coverLetterUrl || "",
          transcriptUrl: profile.transcriptUrl || "",
          latexUrl: profile.latexUrl || "",
          preferredJobTitles: profile.preferredJobTitles || "",
          preferredCompanies: profile.preferredCompanies || "",
          autoApply: profile.autoApply,
          additionalNotes: profile.additionalNotes || "",
          termsAccepted: profile.is_onboarded,
        }));
        setStep(profile.onboarding_step ?? 1);
      } catch (error: unknown) {
        console.error("Error fetching onboarding profile:", error instanceof Error ? error.message : error);
        if (error instanceof Error && error.message.toLowerCase().includes("token has expired")) {
          localStorage.removeItem("access_token");
          document.cookie = "access_token=; Path=/; Max-Age=0";
          router.replace("/login");
        }
      } finally {
        setProfileLoaded(true);
      }
    };
    void loadProfile();
  }, [router]);

  const [formData, setFormData] = useState<FormData>({
    email: "",
    phoneNumber: "",
    address: "",
    university: "",
    aboutMe: "",
    openAIKey: "",
    archiveDuration: "A Month",
    deleteDuration: "A Month",
    leetcodeEnabled: false,
    leetcodeGoal: "",
    behaviouralEnabled: false,
    behaviouralGoal: "",
    jobsEnabled: false,
    jobsGoal: "",
    systemDesignEnabled: false,
    systemDesignGoal: "",
    resumeUrl: "",
    coverLetterUrl: "",
    transcriptUrl: "",
    latexUrl: "",
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

  // Handle select dropdown changes
  const handleSelectChange = (name: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  const isStepValid = (): boolean => {
    switch (step) {
      case 1:
        return (
          formData.email.trim() !== "" &&
          formData.phoneNumber.trim() !== "" &&
          formData.address.trim() !== "" &&
          formData.university.trim() !== "" &&
          formData.aboutMe.trim() !== "" &&
          formData.openAIKey.trim() !== ""
        );
      case 2:
        return (
          (!formData.leetcodeEnabled || formData.leetcodeGoal.trim() !== "") &&
          (!formData.behaviouralEnabled || formData.behaviouralGoal.trim() !== "") &&
          (!formData.jobsEnabled || formData.jobsGoal.trim() !== "") &&
          (!formData.systemDesignEnabled || formData.systemDesignGoal.trim() !== "")
        );
      case 3:
        return (
          formData.resumeUrl.trim() !== "" &&
          formData.coverLetterUrl.trim() !== "" &&
          formData.transcriptUrl.trim() !== "" &&
          formData.latexUrl.trim() !== ""
        );
      case 4:
        return formData.preferredJobTitles.trim() !== "" && formData.preferredCompanies.trim() !== "";
      case 5:
        return formData.termsAccepted;
      default:
        return false;
    }
  };

  // After loader starts, redirect once loadingStates have cycled
  useEffect(() => {
    if (isSubmitting) {
      // total loader duration = number of states * duration per state
      const redirectDelay = loadingStates.length * 2000;
      const timer = setTimeout(() => {
        window.location.href = "/dashboard";
      }, redirectDelay);
      return () => clearTimeout(timer);
    }
  }, [isSubmitting]);

  const nextStep = async () => {
    if (!isStepValid()) return;
    // persist current step data to backend
    try {
      console.log("Onboarding PUT step:", step, formData);
      // Prepare payload with proper types for goals and terms accepted
      const payload: Partial<Profile> & { step: number } = {
        step,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        address: formData.address,
        university: formData.university,
        aboutMe: formData.aboutMe,
        openAIKey: formData.openAIKey,
        archiveDuration: formData.archiveDuration,
        deleteDuration: formData.deleteDuration,
        leetcodeEnabled: formData.leetcodeEnabled,
        leetcodeGoal: Number(formData.leetcodeGoal),
        behaviouralEnabled: formData.behaviouralEnabled,
        behaviouralGoal: Number(formData.behaviouralGoal),
        jobsEnabled: formData.jobsEnabled,
        jobsGoal: Number(formData.jobsGoal),
        systemDesignEnabled: formData.systemDesignEnabled,
        systemDesignGoal: Number(formData.systemDesignGoal),
        resumeUrl: formData.resumeUrl,
        coverLetterUrl: formData.coverLetterUrl,
        transcriptUrl: formData.transcriptUrl,
        latexUrl: formData.latexUrl,
        preferredJobTitles: formData.preferredJobTitles,
        preferredCompanies: formData.preferredCompanies,
        autoApply: formData.autoApply,
        additionalNotes: formData.additionalNotes,
        termsAccepted: formData.termsAccepted,
      };
      await saveOnboard(payload);
    } catch (error: unknown) {
      console.error("Failed to save onboarding step:", error instanceof Error ? error.message : error);
      return;
    }
    if (step < totalSteps) {
      setDirection(1);
      setStep(step + 1);
    } else {
      // Start the loading animation, useEffect will handle redirect
      setIsSubmitting(true);
      console.log("Form submitted:", formData);
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
        return (
          <PersonalInformationForm
            formData={formData}
            handleInputChange={handleInputChange}
            handleSelectChange={handleSelectChange}
          />
        );
      case 2:
        return (
          <TrackingPreferencesForm
            formData={formData}
            handleCheckboxChange={handleCheckboxChange}
            handleInputChange={handleInputChange}
          />
        );
      case 3:
        return (
          <DocumentsForm
            resumeUrl={formData.resumeUrl}
            coverLetterUrl={formData.coverLetterUrl}
            transcriptUrl={formData.transcriptUrl}
            latexUrl={formData.latexUrl}
            handleFileChange={(field, url) => {
              setFormData((prev) => ({ ...prev, [field]: url }));
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

  // don't render anything until profile load finishes
  if (!profileLoaded) {
    return null;
  }
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
          <div className="flex-grow h-[500px] overflow-y-auto relative">
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
                  className="w-full"
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
              <Button onClick={() => void nextStep()} disabled={!isStepValid()} className="flex items-center gap-2">
                {step === totalSteps ? "Complete" : "Next"} {step !== totalSteps && <ArrowRight className="h-4 w-4" />}
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
