import React, { useState, useEffect } from 'react';
import FileUpload from '@/components/FileUpload';
import Map from '@/components/Map';
import { Timeline } from '@/components/Timeline';
import { Card, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { filterDataByYear, getYearRange } from '@/utils/locationProcessor';

const Index = () => {
  const [geoJsonData, setGeoJsonData] = useState<any>(null);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [yearRange, setYearRange] = useState<[number, number]>([2000, new Date().getFullYear()]);
  const [filteredData, setFilteredData] = useState<any>(null);

  useEffect(() => {
    if (geoJsonData) {
      // Update year range based on actual data
      const range = getYearRange(geoJsonData);
      setYearRange(range);
      setSelectedYear(range[1]); // Set to most recent year
      
      // Filter data for selected year
      const filtered = filterDataByYear(geoJsonData, selectedYear);
      console.log(`Filtered ${filtered.features.length} locations for year ${selectedYear}`);
      setFilteredData(filtered);
    }
  }, [geoJsonData]);

  useEffect(() => {
    if (geoJsonData) {
      const filtered = filterDataByYear(geoJsonData, selectedYear);
      console.log(`Filtered ${filtered.features.length} locations for year ${selectedYear}`);
      setFilteredData(filtered);
    }
  }, [selectedYear]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto p-4 space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500">
            Time Travel Through Your Locations
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Upload your Google Timeline JSON file to visualize your journey through time and space
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_2fr]">
          <div className="space-y-6">
            <Card className="bg-card/50 backdrop-blur border-muted">
              <CardContent className="p-6">
                <FileUpload onFileProcessed={setGeoJsonData} />
              </CardContent>
            </Card>

            {geoJsonData && (
              <Card className="bg-card/50 backdrop-blur border-muted">
                <CardContent className="p-6 space-y-4">
                  <h2 className="text-xl font-semibold">Time Navigation</h2>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground">Select Year</label>
                      <Slider
                        value={[selectedYear]}
                        min={yearRange[0]}
                        max={yearRange[1]}
                        step={1}
                        onValueChange={(value) => setSelectedYear(value[0])}
                        className="w-full"
                      />
                      <div className="text-center text-2xl font-bold text-primary">
                        {selectedYear}
                      </div>
                    </div>
                    
                    <div className="text-sm text-muted-foreground">
                      {filteredData?.features.length || 0} locations found in {selectedYear}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card className="bg-card/50 backdrop-blur border-muted h-[600px]">
              <CardContent className="p-0 h-full">
                <Map geoJsonData={filteredData} />
              </CardContent>
            </Card>
          </div>
        </div>

        {geoJsonData && (
          <Timeline
            items={[
              {
                year: selectedYear,
                title: `${filteredData?.features.length || 0} Locations`,
                description: "Explore your visited places",
              }
            ]}
          />
        )}
      </div>
    </div>
  );
};

export default Index;