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
  const [showTransports, setShowTransports] = useState(false);
  const sourceAdded = useRef(false);

  // Process data to separate static locations and transports
  const processData = (data: any) => {
    if (!data?.features) return { locations: null, transports: null };

    // Create a Map to store unique locations based on coordinates
    const uniqueLocations = new Map();
    const transports = [];

    for (const feature of data.features) {
      const coords = feature.geometry.coordinates;
      const key = `${coords[0]},${coords[1]}`;
      
      if (feature.properties.semanticType?.toLowerCase().includes('transport') ||
          feature.properties.semanticType?.toLowerCase().includes('moving')) {
        transports.push(feature);
      } else {
        // Only keep the most recent visit to this location
        if (!uniqueLocations.has(key) || 
            new Date(feature.properties.timestamp) > new Date(uniqueLocations.get(key).properties.timestamp)) {
          uniqueLocations.set(key, feature);
        }
      }
    }

    return {
      locations: {
        type: 'FeatureCollection',
        features: Array.from(uniqueLocations.values())
      },
      transports: {
        type: 'FeatureCollection',
        features: transports
      }
    };
  };

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

    // Add toggle control for transports
    const toggleControl = document.createElement('button');
    toggleControl.className = 'mapboxgl-ctrl-group mapboxgl-ctrl transport-toggle';
    toggleControl.innerHTML = 'Toggle Transports';
    toggleControl.onclick = () => setShowTransports(prev => !prev);
    newMap.getContainer().appendChild(toggleControl);

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
      
      const geometry = e.features[0].geometry as { coordinates: [number, number] };
      const coordinates = [...geometry.coordinates];
      const properties = e.features[0].properties;
      
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
        .setLngLat(coordinates as [number, number])
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

    const { locations, transports } = processData(geoJsonData);
    if (!locations) return;

    console.log('Updating map with data:', {
      locationCount: locations.features.length,
      transportCount: transports?.features.length
    });

    const currentMap = map.current;

    try {
      // Clean up existing layers and sources
      ['locations', 'transports'].forEach(layer => {
        if (currentMap.getLayer(layer)) {
          currentMap.removeLayer(layer);
        }
        if (currentMap.getSource(layer)) {
          currentMap.removeSource(layer);
        }
      });

      // Add locations source and layer
      currentMap.addSource('locations', {
        type: 'geojson',
        data: locations
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
          'circle-opacity': 0.8,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#FFFFFF',
          'circle-stroke-opacity': 0.6
        }
      });

      // Add transports source and layer if available
      if (transports && showTransports) {
        currentMap.addSource('transports', {
          type: 'geojson',
          data: transports
        });

        currentMap.addLayer({
          id: 'transports',
          type: 'line',
          source: 'transports',
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': '#FF4B4B',
            'line-width': 2,
            'line-opacity': 0.6
          }
        });
      }

      sourceAdded.current = true;

      // Calculate bounds for locations
      if (locations.features.length > 0) {
        const bounds = new mapboxgl.LngLatBounds();
        locations.features.forEach((feature: any) => {
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
  }, [geoJsonData, mapLoaded, showTransports]);

  return (
    <div className="relative w-full h-full min-h-[500px]">
      <div ref={mapContainer} className="absolute inset-0 rounded-lg overflow-hidden" />
      <style>
        {`
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
        .transport-toggle {
          @apply px-2 py-1 bg-background text-foreground border border-border rounded shadow-sm hover:bg-accent transition-colors;
          position: absolute;
          top: 10px;
          left: 10px;
          z-index: 1;
        }
        `}
      </style>
    </div>
  );
};

export default Map;
