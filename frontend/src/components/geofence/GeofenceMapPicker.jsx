import { Fragment, useMemo, useRef } from 'react';
import { CircleF, GoogleMap, MarkerF, StandaloneSearchBox, useJsApiLoader } from '@react-google-maps/api';
import { MapPin, LocateFixed, Search } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card } from '../ui/card';

const mapContainerStyle = {
  width: '100%',
  height: '420px'
};

const defaultLibraries = ['places'];

const parseAddressComponents = (place) => {
  const components = place?.address_components || [];

  const getComponent = (type) =>
    components.find((component) => component.types?.includes(type))?.long_name || '';

  return {
    address: place?.formatted_address || '',
    city: getComponent('locality') || getComponent('administrative_area_level_2'),
    state: getComponent('administrative_area_level_1'),
    country: getComponent('country')
  };
};

const GeofenceMapPicker = ({ value, onChange, offices = [], onUseCurrentLocation }) => {
  const searchBoxRef = useRef(null);
  const geocoderRef = useRef(null);
  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  const center = useMemo(
    () => ({
      lat: Number(value.latitude) || 28.6139,
      lng: Number(value.longitude) || 77.209
    }),
    [value.latitude, value.longitude]
  );

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey,
    libraries: defaultLibraries
  });

  const handleSearchLoad = (searchBox) => {
    searchBoxRef.current = searchBox;
  };

  const reverseGeocode = (coordinates) => {
    if (!window.google) return;

    if (!geocoderRef.current) {
      geocoderRef.current = new window.google.maps.Geocoder();
    }

    geocoderRef.current.geocode({ location: coordinates }, (results, status) => {
      if (status !== 'OK' || !results?.[0]) {
        return;
      }

      const addressData = parseAddressComponents(results[0]);

      onChange({
        ...value,
        ...addressData,
        googleMapUrl: `https://www.google.com/maps?q=${coordinates.lat},${coordinates.lng}`
      });
    });
  };

  const handlePlacesChanged = () => {
    const places = searchBoxRef.current?.getPlaces?.();
    if (!places || !places.length) return;

    const selected = places[0];
    const latitude = selected.geometry?.location?.lat?.();
    const longitude = selected.geometry?.location?.lng?.();

    if (latitude === undefined || longitude === undefined) return;

    const addressData = parseAddressComponents(selected);

    onChange({
      ...value,
      latitude,
      longitude,
      ...addressData,
      googleMapUrl: `https://www.google.com/maps?q=${latitude},${longitude}`
    });
  };

  const handleMarkerDragEnd = (event) => {
    const latitude = event.latLng?.lat?.();
    const longitude = event.latLng?.lng?.();
    if (latitude === undefined || longitude === undefined) return;

    onChange({
      ...value,
      latitude,
      longitude,
      googleMapUrl: `https://www.google.com/maps?q=${latitude},${longitude}`
    });

    reverseGeocode({ lat: latitude, lng: longitude });
  };

  if (!googleMapsApiKey) {
    return (
      <Card className="p-4">
        <p className="error-text">
          Missing `VITE_GOOGLE_MAPS_API_KEY`. Add it to `frontend/.env` to enable map features.
        </p>
      </Card>
    );
  }

  if (loadError) {
    return (
      <Card className="p-4">
        <p className="error-text">Failed to load Google Maps API.</p>
      </Card>
    );
  }

  if (!isLoaded) {
    return (
      <Card className="p-4">
        <p className="small">Loading map...</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="inline-actions">
        <div className="relative min-w-[280px] flex-1">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <StandaloneSearchBox onLoad={handleSearchLoad} onPlacesChanged={handlePlacesChanged}>
            <Input placeholder="Search office location with Google Places" className="pl-9" />
          </StandaloneSearchBox>
        </div>
        <Button type="button" variant="secondary" onClick={onUseCurrentLocation}>
          <LocateFixed size={16} />
          Use Current Location
        </Button>
      </div>

      <GoogleMap mapContainerStyle={mapContainerStyle} center={center} zoom={14} options={{ zoomControl: true }}>
        <MarkerF position={center} draggable onDragEnd={handleMarkerDragEnd} />
        <CircleF
          center={center}
          radius={Number(value.radiusInMeters) || 100}
          options={{
            fillColor: '#10b981',
            fillOpacity: 0.12,
            strokeColor: '#059669',
            strokeWeight: 2
          }}
        />

        {offices
          .filter((office) => office.isActive)
          .map((office) => (
            <Fragment key={office._id}>
              <MarkerF
                position={{ lat: office.latitude, lng: office.longitude }}
                icon={{
                  path: window.google.maps.SymbolPath.CIRCLE,
                  scale: 6,
                  fillColor: '#0ea5e9',
                  fillOpacity: 1,
                  strokeColor: '#0369a1',
                  strokeWeight: 1
                }}
              />
              <CircleF
                center={{ lat: office.latitude, lng: office.longitude }}
                radius={office.radiusInMeters}
                options={{
                  fillColor: '#0ea5e9',
                  fillOpacity: 0.08,
                  strokeColor: '#0284c7',
                  strokeWeight: 1
                }}
              />
            </Fragment>
          ))}
      </GoogleMap>

      <div className="grid gap-2 rounded-xl border border-slate-200 bg-white/80 p-3 sm:grid-cols-3">
        <p className="small inline-flex items-center gap-1">
          <MapPin size={14} /> Lat: {Number(value.latitude || 0).toFixed(6)}
        </p>
        <p className="small">Lng: {Number(value.longitude || 0).toFixed(6)}</p>
        <p className="small">Radius: {value.radiusInMeters || 0} meters</p>
      </div>
    </div>
  );
};

export default GeofenceMapPicker;
