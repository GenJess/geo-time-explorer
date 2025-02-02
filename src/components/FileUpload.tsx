import React, { useCallback, useState } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { processLocationData } from '@/utils/locationProcessor';
import { X, File } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FileUploadProps {
  onFileProcessed: (geoJson: any) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileProcessed }) => {
  const { toast } = useToast();
  const [currentFile, setCurrentFile] = useState<File | null>(null);

  const processFile = useCallback(async (file: File) => {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const geoJson = processLocationData(data);
      
      setCurrentFile(file);
      onFileProcessed(geoJson);
      toast({
        title: "Success",
        description: `Processed ${geoJson.features.length} locations successfully`,
      });
    } catch (error) {
      console.error('Error processing file:', error);
      toast({
        title: "Error",
        description: "Failed to process file. Please ensure it's a valid JSON file.",
        variant: "destructive",
      });
    }
  }, [onFileProcessed, toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleRemove = useCallback(() => {
    setCurrentFile(null);
    onFileProcessed(null);
  }, [onFileProcessed]);

  if (currentFile) {
    return (
      <div className="flex items-center justify-between p-4 border rounded-lg bg-card/50 backdrop-blur animate-fade-up">
        <div className="flex items-center gap-2">
          <File className="w-4 h-4" />
          <span className="text-sm font-medium">{currentFile.name}</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRemove}
          className="hover:bg-destructive/10"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <div
      className="w-full p-8 border-2 border-dashed border-gray-300 rounded-lg 
                 hover:border-primary transition-colors duration-200 cursor-pointer
                 animate-fade-up"
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      onClick={() => document.getElementById('fileInput')?.click()}
    >
      <input
        id="fileInput"
        type="file"
        accept=".json"
        onChange={handleFileInput}
        className="hidden"
      />
      <div className="text-center">
        <p className="text-lg mb-2">Drop your Google Timeline JSON file here</p>
        <p className="text-sm text-gray-500">or click to select file</p>
      </div>
    </div>
  );
};

export default FileUpload;