import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface MapProps {
  geoJsonData?: any;
}

const Map: React.FC<MapProps> = ({ geoJsonData }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    mapboxgl.accessToken = 'pk.eyJ1IjoiZ2VuamVzcyIsImEiOiJjbTZsdDI2NnAwZDdvMmpwenJxZDIwemk0In0.J8bNiwGDV1rXvyzj0PkuRw';
    
    const newMap = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [0, 0],
      zoom: 1,
      pitch: 45,
      projection: 'globe'
    });

    newMap.addControl(
      new mapboxgl.NavigationControl({
        visualizePitch: true,
      }),
      'top-right'
    );

    newMap.on('load', () => {
      newMap.setFog({
        color: 'rgb(186, 210, 235)',
        'high-color': 'rgb(36, 92, 223)',
        'horizon-blend': 0.02,
        'space-color': 'rgb(11, 11, 25)',
        'star-intensity': 0.6
      });
      setMapLoaded(true);
    });

    map.current = newMap;

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
        setMapLoaded(false);
      }
    };
  }, []);

  // Handle data updates
  useEffect(() => {
    if (!map.current || !mapLoaded || !geoJsonData?.features?.length) return;

    const currentMap = map.current;

    try {
      // Clean up existing layers and sources
      if (currentMap.getLayer('locations')) {
        currentMap.removeLayer('locations');
      }
      if (currentMap.getSource('locations')) {
        currentMap.removeSource('locations');
      }

      // Add new source and layer
      currentMap.addSource('locations', {
        type: 'geojson',
        data: geoJsonData
      });

      currentMap.addLayer({
        id: 'locations',
        type: 'circle',
        source: 'locations',
        paint: {
          'circle-radius': 6,
          'circle-color': '#4A90E2',
          'circle-opacity': 0.8,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#FFFFFF'
        }
      });

      // Calculate bounds
      const validFeatures = geoJsonData.features.filter(
        (f: any) => f.geometry && 
                    f.geometry.coordinates && 
                    Array.isArray(f.geometry.coordinates) && 
                    f.geometry.coordinates.length === 2
      );

      if (validFeatures.length > 0) {
        const bounds = new mapboxgl.LngLatBounds();
        validFeatures.forEach((feature: any) => {
          bounds.extend(feature.geometry.coordinates as [number, number]);
        });

        currentMap.fitBounds(bounds, {
          padding: 50,
          duration: 1000
        });
      }
    } catch (error) {
      console.error('Error updating map:', error);
    }
  }, [geoJsonData, mapLoaded]);

  return (
    <div className="relative w-full h-full min-h-[500px]">
      <div ref={mapContainer} className="absolute inset-0 rounded-lg overflow-hidden" />
    </div>
  );
};

export default Map;