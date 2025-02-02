interface LocationFeature {
  type: 'Feature';
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
  properties: {
    timestamp: string;
    endTime?: string;
    semanticType?: string;
    probability?: string;
    durationOffset?: number;
  };
}

interface GeoJsonData {
  type: 'FeatureCollection';
  features: LocationFeature[];
}

export const processLocationData = (data: any[]): GeoJsonData => {
  const features: LocationFeature[] = [];
  
  data.forEach((entry: any) => {
    try {
      if (entry.timelinePath) {
        entry.timelinePath.forEach((path: any) => {
          if (path.point) {
            const [lat, lng] = path.point.replace('geo:', '').split(',').map(Number);
            if (!isNaN(lat) && !isNaN(lng)) {
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
          }
        });
      } else if (entry.visit?.topCandidate?.placeLocation) {
        const [lat, lng] = entry.visit.topCandidate.placeLocation.replace('geo:', '').split(',').map(Number);
        if (!isNaN(lat) && !isNaN(lng)) {
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
      }
    } catch (error) {
      console.error('Error processing entry:', error);
    }
  });

  return {
    type: 'FeatureCollection',
    features
  };
};

export const filterDataByYear = (data: GeoJsonData, year: number): GeoJsonData => {
  if (!data?.features) return { type: 'FeatureCollection', features: [] };
  
  const features = data.features.filter(feature => {
    const date = new Date(feature.properties.timestamp);
    return date.getFullYear() === year;
  });

  return {
    type: 'FeatureCollection',
    features
  };
};

export const getYearRange = (data: GeoJsonData): [number, number] => {
  if (!data?.features?.length) return [2000, new Date().getFullYear()];
  
  const years = data.features.map(feature => 
    new Date(feature.properties.timestamp).getFullYear()
  );
  
  return [Math.min(...years), Math.max(...years)];
};