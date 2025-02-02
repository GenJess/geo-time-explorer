import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface MapProps {
  geoJsonData?: any;
}

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
  };
}

const Map: React.FC<MapProps> = ({ geoJsonData }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const sourceAdded = useRef(false);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    console.log('Initializing map...');
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
      console.log('Map loaded');
      newMap.setFog({
        color: 'rgb(186, 210, 235)',
        'high-color': 'rgb(36, 92, 223)',
        'horizon-blend': 0.02,
        'space-color': 'rgb(11, 11, 25)',
        'star-intensity': 0.6
      });
      setMapLoaded(true);
    });

    // Add click event for markers
    newMap.on('click', 'locations', (e) => {
      if (!e.features?.[0]) return;
      
      const coordinates = (e.features[0].geometry as { coordinates: [number, number] }).coordinates.slice();
      const properties = e.features[0].properties;
      
      // Format the popup content
      const startTime = new Date(properties.timestamp).toLocaleString();
      const endTime = properties.endTime ? new Date(properties.endTime).toLocaleString() : 'N/A';
      const locationType = properties.semanticType || 'Unknown location type';
      
      const popupContent = `
        <div class="p-2">
          <p class="font-semibold">${locationType}</p>
          <p class="text-sm">Start: ${startTime}</p>
          <p class="text-sm">End: ${endTime}</p>
        </div>
      `;

      new mapboxgl.Popup({
        className: 'location-popup animate-fade-up',
        closeButton: true,
        closeOnClick: true,
        maxWidth: '300px'
      })
        .setLngLat(coordinates)
        .setHTML(popupContent)
        .addTo(newMap);
    });

    // Change cursor to pointer when hovering locations
    newMap.on('mouseenter', 'locations', () => {
      if (newMap.getCanvas()) {
        newMap.getCanvas().style.cursor = 'pointer';
      }
    });

    newMap.on('mouseleave', 'locations', () => {
      if (newMap.getCanvas()) {
        newMap.getCanvas().style.cursor = '';
      }
    });

    map.current = newMap;

    return () => {
      console.log('Cleaning up map...');
      if (map.current) {
        map.current.remove();
        map.current = null;
        setMapLoaded(false);
        sourceAdded.current = false;
      }
    };
  }, []);

  // Handle data updates
  useEffect(() => {
    if (!map.current || !mapLoaded || !geoJsonData?.features?.length) {
      console.log('Skipping data update:', {
        hasMap: !!map.current,
        isLoaded: mapLoaded,
        features: geoJsonData?.features?.length
      });
      return;
    }

    console.log('Updating map with data:', {
      featureCount: geoJsonData.features.length,
      firstFeature: geoJsonData.features[0]
    });

    const currentMap = map.current;

    try {
      // Clean up existing layers and sources
      if (currentMap.getLayer('locations')) {
        currentMap.removeLayer('locations');
      }
      if (currentMap.getSource('locations')) {
        currentMap.removeSource('locations');
      }

      // Add new source and layer with animations
      currentMap.addSource('locations', {
        type: 'geojson',
        data: geoJsonData
      });

      currentMap.addLayer({
        id: 'locations',
        type: 'circle',
        source: 'locations',
        paint: {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            0, 3,
            22, 8
          ],
          'circle-color': '#4A90E2',
          'circle-opacity': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            1,
            0.8
          ],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#FFFFFF',
          'circle-stroke-opacity': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            1,
            0.6
          ]
        }
      });

      sourceAdded.current = true;

      // Calculate bounds
      const validFeatures = geoJsonData.features.filter(
        (f: any) => {
          const isValid = f.geometry && 
                    f.geometry.coordinates && 
                    Array.isArray(f.geometry.coordinates) && 
                    f.geometry.coordinates.length === 2 &&
                    !isNaN(f.geometry.coordinates[0]) &&
                    !isNaN(f.geometry.coordinates[1]);
          if (!isValid) {
            console.warn('Invalid feature:', f);
          }
          return isValid;
        }
      );

      console.log('Valid features:', validFeatures.length);

      if (validFeatures.length > 0) {
        const bounds = new mapboxgl.LngLatBounds();
        validFeatures.forEach((feature: any) => {
          bounds.extend(feature.geometry.coordinates as [number, number]);
        });

        currentMap.fitBounds(bounds, {
          padding: 50,
          duration: 2000,
          essential: true
        });
      }
    } catch (error) {
      console.error('Error updating map:', error);
    }
  }, [geoJsonData, mapLoaded]);

  return (
    <div className="relative w-full h-full min-h-[500px]">
      <div ref={mapContainer} className="absolute inset-0 rounded-lg overflow-hidden" />
      <style>{`
        .location-popup {
          @apply bg-background border border-border rounded-lg shadow-lg;
        }
        .location-popup .mapboxgl-popup-content {
          @apply bg-background text-foreground p-0 rounded-lg border-none shadow-none;
        }
        .location-popup .mapboxgl-popup-close-button {
          @apply text-foreground hover:text-primary transition-colors;
        }
        .location-popup .mapboxgl-popup-tip {
          @apply border-t-background;
        }
      `}</style>
    </div>
  );
};

export default Map;