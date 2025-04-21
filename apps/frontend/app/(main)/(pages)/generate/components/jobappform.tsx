import React from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

// Define the form schema
const formSchema = z.object({
  jobTitle: z.string().min(1, "Job title is required"),
  company: z.string().min(1, "Company name is required"),
  jobDescription: z.string().min(10, "Job description must be at least 10 characters"),
  resumeData: z.string().optional(),
  includeResumeData: z.boolean().default(true),
  includeCoverLetter: z.boolean().default(true),
});

// Define types based on the schema
type FormValues = z.infer<typeof formSchema>;

interface JobApplicationFormProps {
  onSubmit: (values: FormValues) => void;
  isSubmitting?: boolean;
  isLoading?: boolean;
  resumeData?: string;
  onToggleDocument?: (docType: string) => void;
  selectedDocuments?: string[];
}

export function JobApplicationForm({
  onSubmit,
  isSubmitting = false,
  isLoading = false,
  resumeData = "",
  onToggleDocument,
  selectedDocuments = ["resume", "cover_letter"],
}: JobApplicationFormProps) {
  // Initialize the form with default values
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      jobTitle: "",
      company: "",
      jobDescription: "",
      resumeData: resumeData,
      includeResumeData: !!resumeData,
      includeCoverLetter: true,
    },
  });

  // Handle form submission
  const handleSubmit = (values: FormValues) => {
    onSubmit({
      ...values,
      resumeData: values.includeResumeData ? resumeData : "",
    });
  };

  // Handle document selection toggle
  const handleToggleDocument = (docType: string, checked: boolean) => {
    if (onToggleDocument) {
      onToggleDocument(docType);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Job Application Details</CardTitle>
      </CardHeader>
      <Form {...form}>
        <form
          onSubmit={(e) => {
            void form.handleSubmit(handleSubmit)(e);
          }}
        >
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="jobTitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Software Engineer" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="company"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company</FormLabel>
                  <FormControl>
                    <Input placeholder="Acme Inc." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="jobDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Paste the full job description here..." className="min-h-[200px]" {...field} />
                  </FormControl>
                  <FormDescription>Paste the complete job description for better results</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="includeResumeData"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Generate Resume</FormLabel>
                    <FormDescription>Create a tailored resume for this job</FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={(checked) => {
                        field.onChange(checked);
                        handleToggleDocument("resume", checked);
                      }}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="includeCoverLetter"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Generate Cover Letter</FormLabel>
                    <FormDescription>Create a personalized cover letter for this job</FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={(checked) => {
                        field.onChange(checked);
                        handleToggleDocument("cover_letter", checked);
                      }}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isSubmitting || isLoading}>
              {isSubmitting ? "Generating..." : "Generate Application"}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
