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
      
      // Convert to GeoJSON
      const features: any[] = [];
      
      // Process each entry in the JSON array
      data.forEach((entry: any) => {
        // Handle timeline paths
        if (entry.timelinePath) {
          entry.timelinePath.forEach((path: any) => {
            if (path.point) {
              const [lat, lng] = path.point.replace('geo:', '').split(',').map(Number);
              features.push({
                type: 'Feature',
                geometry: {
                  type: 'Point',
                  coordinates: [lng, lat]
                },
                properties: {
                  timestamp: entry.startTime,
                  durationOffset: path.durationMinutesOffsetFromStartTime
                }
              });
            }
          });
        }
        // Handle visit locations
        else if (entry.visit?.topCandidate?.placeLocation) {
          const [lat, lng] = entry.visit.topCandidate.placeLocation.replace('geo:', '').split(',').map(Number);
          features.push({
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [lng, lat]
            },
            properties: {
              timestamp: entry.startTime,
              endTime: entry.endTime,
              semanticType: entry.visit.topCandidate.semanticType,
              probability: entry.visit.topCandidate.probability
            }
          });
        }
      });

      const geoJson = {
        type: 'FeatureCollection',
        features
      };

      onFileProcessed(geoJson);
      toast({
        title: "Success",
        description: `Processed ${features.length} locations successfully`,
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