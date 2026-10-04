'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  APIProvider,
  Map,
  Marker,
  InfoWindow,
  useMap
} from '@vis.gl/react-google-maps';
import { Property } from '@/types';
import { PropertyPopup } from './PropertyPopup';

interface PropertyMapProps {
  properties: Property[];
  onPropertySelect?: (property: Property) => void;
  onViewDetails?: (property: Property) => void;
  onAddToList?: (property: Property) => void;
  selectedPropertyId?: string | null;
}

// Color coding by status and equity
const getMarkerColor = (property: Property): string => {
  if (property.equity_percent >= 50 && property.loan_balance === 0) {
    return '#10b981'; // Green - High equity, free & clear
  }
  if (['foreclosure', 'pre_foreclosure', 'auction', 'reo'].includes(property.listing_status)) {
    return '#ef4444'; // Red - Foreclosure related
  }
  if (property.owner_type === 'absentee' && property.listing_status === 'off_market') {
    return '#f59e0b'; // Amber - Vacant/absentee
  }
  return '#1a56db'; // Blue - Standard
};

function BoundsHandler({ properties }: { properties: Property[] }) {
  const map = useMap();

  useEffect(() => {
    if (!map || properties.length === 0) return;

    const bounds = new google.maps.LatLngBounds();
    properties.forEach(p => bounds.extend({ lat: p.latitude, lng: p.longitude }));
    map.fitBounds(bounds);
  }, [properties, map]);

  return null;
}

export default function PropertyMap({
  properties,
  onPropertySelect,
  onViewDetails,
  onAddToList,
  selectedPropertyId,
}: PropertyMapProps) {
  const [openedProperty, setOpenedProperty] = useState<Property | null>(null);

  // Use the API key from environment variables (NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is the
  // documented name in .env.example; NEXT_PUBLIC_GOOGLE_MAPS_API kept for backwards compat).
  const apiKey =
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API ||
    'AIzaSyAWIxmH3uAvzCQKAF5jfCDLdJcnDoe4wjM';

  return (
    <div className="relative w-full h-full">
      <APIProvider apiKey={apiKey}>
        <Map
          defaultCenter={{ lat: 39.8283, lng: -98.5795 }}
          defaultZoom={4}
          mapId="DEMO_MAP_ID" // Required for advanced markers
          disableDefaultUI={true}
          className="w-full h-full"
        >
          <BoundsHandler properties={properties} />

          {properties.map((property) => (
            <Marker
              key={property.id}
              position={{ lat: property.latitude, lng: property.longitude }}
              onClick={() => {
                setOpenedProperty(property);
                onPropertySelect?.(property);
              }}
            />
          ))}

          {openedProperty && (
            <InfoWindow
              position={{ lat: openedProperty.latitude, lng: openedProperty.longitude }}
              onCloseClick={() => setOpenedProperty(null)}
            >
              <div className="p-1">
                <PropertyPopup
                  property={openedProperty}
                  onViewDetails={onViewDetails}
                  onAddToList={onAddToList}
                />
              </div>
            </InfoWindow>
          )}
        </Map>
      </APIProvider>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-background/95 backdrop-blur-sm rounded-md shadow-md p-3 z-[1000]">
        <p className="text-xs font-semibold mb-2 text-foreground">Marker Legend</p>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#1a56db]" />
            <span className="text-xs text-muted-foreground">Standard / Off-Market</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#ef4444]" />
            <span className="text-xs text-muted-foreground">Foreclosure / REO</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#10b981]" />
            <span className="text-xs text-muted-foreground">High Equity (50%+)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#f59e0b]" />
            <span className="text-xs text-muted-foreground">Vacant / Absentee</span>
          </div>
        </div>
      </div>
    </div>
  );
}
