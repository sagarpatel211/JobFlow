"use client";
import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Cloud, File } from "lucide-react";

interface FileUploadProps {
  title: string;
  onFileChange: (file: File) => void;
}

export function FileUpload({ title, onFileChange }: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const selectedFile = acceptedFiles[0];
      setFile(selectedFile);
      onFileChange(selectedFile);

      let currentProgress = 0;
      const interval = setInterval(() => {
        currentProgress += 10;
        setProgress(currentProgress);
        if (currentProgress >= 100) {
          clearInterval(interval);
        }
      }, 200);
    },
    [onFileChange],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  return (
    <Card className="p-4">
      <h2 className="text-xl mb-4">{title}</h2>
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 cursor-pointer transition-colors ${
          isDragActive ? "border-green-500 bg-green-50" : "border-gray-300"
        }`}
      >
        <input {...getInputProps()} />
        {file ? (
          <div className="flex items-center space-x-2">
            <File className="w-8 h-8 text-green-500" />
            <span className="text-green-500">{file.name}</span>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <Cloud className="w-12 h-12 text-gray-400" />
            <p className="text-gray-500">
              {isDragActive ? "Drop the file here" : "Drag and drop a file here, or click to select a file"}
            </p>
          </div>
        )}
      </div>
      {file && progress < 100 && (
        <div className="mt-4">
          <Progress value={progress} className="w-full h-2 bg-gray-600">
            <div
              className="h-full bg-green-500 transition-all duration-300 ease-in-out"
              style={{ width: `${progress.toString()}%` }}
            />
          </Progress>
        </div>
      )}
    </Card>
  );
}
