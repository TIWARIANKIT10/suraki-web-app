import { useEffect, useState } from "react";
import { MapPin, RefreshCw } from "lucide-react";
import { useIncidentStore } from "@/lib/store/incidentStore";

const colors = {
  bgColor: "#F3F8F6",
  white: "#FFFFFF",
  textColor: "#475467",
  primary2: "#1E5B4F",
  primary3: "#2E8B75",
  primary4: "#8AA39B",
  redColor: "#D64545",
};

export default function GPSLocation() {

    const setGPS = useIncidentStore((s) => s.setGPS) 
  const [gpsLocation, setGpsLocation] = useState({ latitude: 0, longitude: 0 });
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const fetchLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      return;
    }

    setLoadingLocation(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGpsLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });

        setGPS({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,

        });
        setLoadingLocation(false);
      },
      (error) => {
        setLocationError(error.message);
        setLoadingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  useEffect(() => {
    fetchLocation();
  }, []);

  return (
    <div className="mb-5">
      <p className="mb-2 text-base font-semibold" style={{ color: colors.primary2 }}>
        जीपीएस स्थान (GPS Location)
      </p>

      <div className="rounded-2xl bg-white p-4 shadow-sm">
        {/* Header */}
        <div className="mb-3 flex items-center gap-2">
          <MapPin size={20} color={colors.redColor} />
          <p className="font-medium" style={{ color: colors.primary2 }}>
            Current Location
          </p>
          {loadingLocation && (
            <span className="ml-2 text-xs" style={{ color: colors.primary3 }}>
              Loading...
            </span>
          )}
        </div>

        {/* Coordinates */}
        {!locationError ? (
          <div className="rounded-xl p-3" style={{ backgroundColor: "#F6FAF8" }}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span style={{ color: colors.textColor }}>Latitude:</span>
              <span className="font-semibold" style={{ color: colors.primary3 }}>
                {loadingLocation ? "—" : gpsLocation.latitude.toFixed(6)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span style={{ color: colors.textColor }}>Longitude:</span>
              <span className="font-semibold" style={{ color: colors.primary3 }}>
                {loadingLocation ? "—" : gpsLocation.longitude.toFixed(6)}
              </span>
            </div>
          </div>
        ) : (
          /* Error State */
          <div
            className="rounded-xl p-3 text-sm"
            style={{ backgroundColor: "#FFF0F0", color: colors.redColor }}
          >
            ⚠️ {locationError}
          </div>
        )}

        {/* Refresh Button */}
        <button
          type="button"
          onClick={fetchLocation}
          disabled={loadingLocation}
          className="mt-3 inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: `${colors.primary3}20`, color: colors.primary3 }}
        >
          <RefreshCw size={16} className={loadingLocation ? "animate-spin" : ""} />
          {loadingLocation ? "Fetching..." : "Refresh Location"}
        </button>
      </div>
    </div>
  );
}