import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Registration } from '../types';
import { getMapBounds, resolveRegistrationCoords } from '../lib/geo';

const memberIcon = L.divIcon({
  className: 'member-map-marker',
  html: '<div class="member-map-marker-dot"></div>',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
  popupAnchor: [0, -12],
});

interface MemberLeafletMapProps {
  registrations: Registration[];
  activeMemberId: string | null;
  onSelectMember: (id: string) => void;
}

function MapViewController({
  registrations,
  activeMemberId,
}: {
  registrations: Registration[];
  activeMemberId: string | null;
}) {
  const map = useMap();

  useEffect(() => {
    const coords = registrations.map((r) =>
      resolveRegistrationCoords(r.city, r.state, r.country, r.id)
    );
    const bounds = getMapBounds(coords);

    if (bounds) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: activeMemberId ? 8 : 5 });
    } else {
      map.setView([20.5937, 78.9629], 4);
    }
  }, [registrations, map, activeMemberId]);

  useEffect(() => {
    if (!activeMemberId) return;
    const member = registrations.find((r) => r.id === activeMemberId);
    if (!member) return;

    const position = resolveRegistrationCoords(
      member.city,
      member.state,
      member.country,
      member.id
    );
    map.flyTo([position.lat, position.lng], 8, { duration: 0.8 });
  }, [activeMemberId, registrations, map]);

  return null;
}

export default function MemberLeafletMap({
  registrations,
  activeMemberId,
  onSelectMember,
}: MemberLeafletMapProps) {
  const defaultCenter: [number, number] = [20.5937, 78.9629];

  return (
    <MapContainer
      center={defaultCenter}
      zoom={4}
      scrollWheelZoom
      className="member-leaflet-map h-full w-full rounded-2xl"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <MapViewController registrations={registrations} activeMemberId={activeMemberId} />

      {registrations.map((member) => {
        const position = resolveRegistrationCoords(
          member.city,
          member.state,
          member.country,
          member.id
        );

        return (
          <Marker
            key={member.id}
            position={[position.lat, position.lng]}
            icon={memberIcon}
            eventHandlers={{
              click: () => onSelectMember(member.id),
            }}
          >
            <Popup>
              <div className="space-y-1.5 min-w-[180px] font-sans text-slate-800">
                <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-1">
                  <span className="text-[10px] font-bold text-primary blur-[4px] select-none">{member.communityId}</span>
                  {member.isVerified && (
                    <span className="text-[10px] font-bold text-emerald-600">Verified</span>
                  )}
                </div>
                <p className="text-sm font-bold text-slate-900">{member.fullName}</p>
                <p className="text-xs text-slate-500">{member.occupation}</p>
                <p className="text-xs text-slate-500">
                  {member.city}, {member.state}, {member.country}
                </p>
                {member.gotra && (
                  <p className="text-xs font-semibold text-slate-600">Gotra: {member.gotra}</p>
                )}
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
