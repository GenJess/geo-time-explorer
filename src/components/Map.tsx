import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface MapProps {
  geoJsonData?: any;
}

const Map: React.FC<MapProps> = ({ geoJsonData }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current || mapInstance.current) return;

    mapboxgl.accessToken = 'pk.eyJ1IjoiZ2VuamVzcyIsImEiOiJjbTZsdDI2NnAwZDdvMmpwenJxZDIwemk0In0.J8bNiwGDV1rXvyzj0PkuRw';
    
    mapInstance.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [0, 0],
      zoom: 1,
      pitch: 45,
      projection: 'globe'
    });

    mapInstance.current.addControl(
      new mapboxgl.NavigationControl({
        visualizePitch: true,
      }),
      'top-right'
    );

    mapInstance.current.on('style.load', () => {
      mapInstance.current?.setFog({
        color: 'rgb(186, 210, 235)',
        'high-color': 'rgb(36, 92, 223)',
        'horizon-blend': 0.02,
        'space-color': 'rgb(11, 11, 25)',
        'star-intensity': 0.6
      });
    });

    return () => {
      mapInstance.current?.remove();
      mapInstance.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapInstance.current || !geoJsonData || !geoJsonData.features || geoJsonData.features.length === 0) return;

    const map = mapInstance.current;

    // Remove existing layers and sources if they exist
    if (map.getLayer('locations')) {
      map.removeLayer('locations');
    }
    if (map.getSource('locations')) {
      map.removeSource('locations');
    }

    // Add new source and layer
    map.addSource('locations', {
      type: 'geojson',
      data: geoJsonData
    });

    map.addLayer({
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

    // Calculate bounds from valid coordinates
    const validFeatures = geoJsonData.features.filter(
      (f: any) => f.geometry && f.geometry.coordinates && 
      Array.isArray(f.geometry.coordinates) && 
      f.geometry.coordinates.length === 2
    );

    if (validFeatures.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      
      validFeatures.forEach((feature: any) => {
        bounds.extend(feature.geometry.coordinates as [number, number]);
      });

      map.fitBounds(bounds, {
        padding: 50,
        duration: 1000
      });
    }
  }, [geoJsonData]);

  return (
    <div className="relative w-full h-full min-h-[500px]">
      <div ref={mapContainer} className="absolute inset-0 rounded-lg overflow-hidden" />
    </div>
  );
};

export default Map;