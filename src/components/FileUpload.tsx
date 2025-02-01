import React, { useCallback } from 'react';
import { useToast } from "@/components/ui/use-toast";

interface FileUploadProps {
  onFileProcessed: (geoJson: any) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileProcessed }) => {
  const { toast } = useToast();

  const processFile = useCallback(async (file: File) => {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      // Basic validation of Google Timeline JSON
      if (!data.locations || !Array.isArray(data.locations)) {
        throw new Error('Invalid file format');
      }

      // Convert to GeoJSON
      const geoJson = {
        type: 'FeatureCollection',
        features: data.locations.map((loc: any) => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [
              loc.longitudeE7 / 1e7,
              loc.latitudeE7 / 1e7
            ]
          },
          properties: {
            timestamp: loc.timestamp,
            accuracy: loc.accuracy
          }
        }))
      };

      onFileProcessed(geoJson);
      toast({
        title: "Success",
        description: "File processed successfully",
      });
    } catch (error) {
      console.error('Error processing file:', error);
      toast({
        title: "Error",
        description: "Failed to process file. Please ensure it's a valid Google Timeline JSON.",
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