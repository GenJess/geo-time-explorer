import React, { useState } from 'react';
import FileUpload from '@/components/FileUpload';
import Map from '@/components/Map';

const Index = () => {
  const [geoJsonData, setGeoJsonData] = useState<any>(null);

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Location History Visualizer</h1>
          <p className="text-muted-foreground">
            Upload your Google Timeline JSON file to visualize your location history
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-[1fr_2fr]">
          <div className="space-y-4">
            <FileUpload onFileProcessed={setGeoJsonData} />
            {geoJsonData && (
              <div className="p-4 bg-card rounded-lg shadow animate-fade-up">
                <h2 className="text-lg font-semibold mb-2">Data Summary</h2>
                <p className="text-sm text-muted-foreground">
                  {geoJsonData.features.length} locations loaded
                </p>
              </div>
            )}
          </div>
          
          <div className="bg-card rounded-lg shadow-lg overflow-hidden">
            <Map geoJsonData={geoJsonData} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;