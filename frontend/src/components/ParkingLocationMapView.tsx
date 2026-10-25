import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import {
  MapPin,
  Car,
  Bike,
  Coffee,
  Building2,
  Navigation,
  CheckCircle2,
  ArrowRight,
  Search,
  Sparkles,
  ShieldCheck,
  Compass,
  Layers,
  ChevronRight,
  Info
} from 'lucide-react';
import { ParkingSlot } from '../types';

export interface NearbyPlace {
  id: string;
  name: string;
  type: 'hotel' | 'cafe';
  categoryLabel: string;
  address: string;
  lat: number;
  lng: number;
  rating: number;
  reviewsCount: number;
  nearestZoneKey: string;
  nearestZoneName: string;
  distanceMeters: number;
  walkingMinutes: number;
  image?: string;
  description: string;
}

export interface ZoneLocation {
  zoneKey: string;
  name: string;
  shortName: string;
  lat: number;
  lng: number;
  description: string;
  color: string;
}

// 4 Parking Zones anchored in central district
export const PARKING_ZONES: ZoneLocation[] = [
  {
    zoneKey: 'Zone A',
    name: 'Zone A (North Wing)',
    shortName: 'Zone A',
    lat: 19.0675,
    lng: 72.8665,
    description: 'Ground Level — Rapid ingress & priority bays',
    color: '#10b981'
  },
  {
    zoneKey: 'Zone B',
    name: 'Zone B (South Plaza)',
    shortName: 'Zone B',
    lat: 19.0635,
    lng: 72.8695,
    description: 'Covered Deck — Shaded multi-tier facility',
    color: '#3b82f6'
  },
  {
    zoneKey: 'Zone C',
    name: 'Zone C (Basement EV)',
    shortName: 'Zone C',
    lat: 19.0650,
    lng: 72.8640,
    description: 'Sub-level — 60kW DC Fast EV Superchargers',
    color: '#8b5cf6'
  },
  {
    zoneKey: 'Zone D',
    name: 'Zone D (East Tower)',
    shortName: 'Zone D',
    lat: 19.0680,
    lng: 72.8715,
    description: 'Executive Wing — Reserved corporate & visitor suites',
    color: '#f59e0b'
  }
];

// Curated Nearby Hotels & Cafes
export const NEARBY_PLACES: NearbyPlace[] = [
  {
    id: 'hotel-1',
    name: 'The Grand Regal Hotel & Suites',
    type: 'hotel',
    categoryLabel: '5-Star Luxury Hotel',
    address: '14 North Boulevard, Financial District',
    lat: 19.0682,
    lng: 72.8658,
    rating: 4.9,
    reviewsCount: 1420,
    nearestZoneKey: 'Zone A',
    nearestZoneName: 'Zone A (North Wing)',
    distanceMeters: 95,
    walkingMinutes: 1,
    description: 'Premier 5-star hotel with fine dining, concierge lounge, and grand ballroom.'
  },
  {
    id: 'cafe-1',
    name: 'Blue Tokai Coffee Roasters',
    type: 'cafe',
    categoryLabel: 'Specialty Artisan Café',
    address: '22 South Plaza Walkway, Courtyard B',
    lat: 19.0642,
    lng: 72.8702,
    rating: 4.8,
    reviewsCount: 890,
    nearestZoneKey: 'Zone B',
    nearestZoneName: 'Zone B (South Plaza)',
    distanceMeters: 110,
    walkingMinutes: 2,
    description: 'Specialty single-origin pour-overs, cold brews, and sourdough bakery.'
  },
  {
    id: 'hotel-2',
    name: 'Hyatt Regency City Centre',
    type: 'hotel',
    categoryLabel: 'Executive Business Hotel',
    address: '88 Central Avenue, North Wing Gateway',
    lat: 19.0668,
    lng: 72.8672,
    rating: 4.8,
    reviewsCount: 1980,
    nearestZoneKey: 'Zone A',
    nearestZoneName: 'Zone A (North Wing)',
    distanceMeters: 130,
    walkingMinutes: 2,
    description: 'High-end corporate hospitality with rooftop pool and convention centre.'
  },
  {
    id: 'cafe-2',
    name: 'Café Coffee Day & Artisan Deli',
    type: 'cafe',
    categoryLabel: 'Popular Café & Lounge',
    address: '5 Green Tech Park, Basement Arcade',
    lat: 19.0655,
    lng: 72.8632,
    rating: 4.6,
    reviewsCount: 650,
    nearestZoneKey: 'Zone C',
    nearestZoneName: 'Zone C (Basement EV)',
    distanceMeters: 120,
    walkingMinutes: 2,
    description: 'Cozy meeting place offering espresso beverages, wraps, and quick bites.'
  },
  {
    id: 'cafe-3',
    name: 'Starbucks Reserve & Lounge',
    type: 'cafe',
    categoryLabel: 'Premium Coffee House',
    address: 'East Promenade, Level 1 Tower Atrium',
    lat: 19.0688,
    lng: 72.8722,
    rating: 4.7,
    reviewsCount: 1120,
    nearestZoneKey: 'Zone D',
    nearestZoneName: 'Zone D (East Tower)',
    distanceMeters: 140,
    walkingMinutes: 2,
    description: 'Reserve bar featuring nitrogen-infused cold brew and boutique pastries.'
  },
  {
    id: 'cafe-4',
    name: 'The Urban Bistro & Brew Bar',
    type: 'cafe',
    categoryLabel: 'Gourmet Bistro & Bakery',
    address: '12 Circuit Way, Tech Hub Concourse',
    lat: 19.0645,
    lng: 72.8652,
    rating: 4.7,
    reviewsCount: 540,
    nearestZoneKey: 'Zone C',
    nearestZoneName: 'Zone C (Basement EV)',
    distanceMeters: 155,
    walkingMinutes: 2,
    description: 'Wood-fired sourdough pizzas, brunch plates, and locally roasted beans.'
  },
  {
    id: 'hotel-3',
    name: 'JW Marriott Executive Suites',
    type: 'hotel',
    categoryLabel: '5-Star Luxury Residences',
    address: '45 South Marina Drive, Plaza Overlook',
    lat: 19.0628,
    lng: 72.8688,
    rating: 4.9,
    reviewsCount: 2240,
    nearestZoneKey: 'Zone B',
    nearestZoneName: 'Zone B (South Plaza)',
    distanceMeters: 150,
    walkingMinutes: 2,
    description: 'Upscale extended stay suites, spa, fitness club, and Italian steakhouse.'
  },
  {
    id: 'hotel-4',
    name: 'The Oberoi Palm Tower',
    type: 'hotel',
    categoryLabel: 'Iconic Grand Hotel',
    address: '10 Financial Tower Boulevard, East Wing',
    lat: 19.0692,
    lng: 72.8705,
    rating: 4.9,
    reviewsCount: 1680,
    nearestZoneKey: 'Zone D',
    nearestZoneName: 'Zone D (East Tower)',
    distanceMeters: 175,
    walkingMinutes: 3,
    description: 'Architectural landmark hotel with panoramic skyline views and Michelin-starred dining.'
  }
];

interface ParkingLocationMapViewProps {
  slots: ParkingSlot[];
  onBookSlot: (slot: ParkingSlot) => void;
  isAdmin?: boolean;
}

export const ParkingLocationMapView: React.FC<ParkingLocationMapViewProps> = ({
  slots,
  onBookSlot,
  isAdmin = false
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const connectionLineRef = useRef<L.Polyline | null>(null);
  const venueMarkersRef = useRef<{ [id: string]: L.Marker }>({});
  const zoneMarkersRef = useRef<{ [key: string]: L.Marker }>({});

  const [selectedPlace, setSelectedPlace] = useState<NearbyPlace>(NEARBY_PLACES[0]);
  const [activeTypeFilter, setActiveTypeFilter] = useState<'all' | 'hotel' | 'cafe'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [vehicleFilter, setVehicleFilter] = useState<'all' | 'Car' | 'Bike'>('all');

  // Filtered places
  const filteredPlaces = NEARBY_PLACES.filter((p) => {
    const matchesType = activeTypeFilter === 'all' || p.type === activeTypeFilter;
    const matchesSearch =
      searchQuery === '' ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.categoryLabel.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.nearestZoneName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  // Available slots for the selected venue's nearest zone
  const zoneSlots = slots.filter((s) => {
    // Match location_zone string with zoneKey (e.g. "Zone A" in "Zone A (North Wing)")
    return s.location_zone.includes(selectedPlace.nearestZoneKey);
  });

  const availableSlotsInZone = zoneSlots.filter((s) => {
    const isAvail = s.status === 'Available';
    const matchesVehicle = vehicleFilter === 'all' || s.vehicle_type === vehicleFilter;
    return isAvail && matchesVehicle;
  });

  // Calculate live available counts per zone
  const getZoneAvailableCount = (zoneKey: string) => {
    return slots.filter((s) => s.location_zone.includes(zoneKey) && s.status === 'Available').length;
  };

  const getZoneTotalCount = (zoneKey: string) => {
    return slots.filter((s) => s.location_zone.includes(zoneKey)).length;
  };

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [19.0665, 72.8680],
        zoom: 16,
        scrollWheelZoom: true,
        zoomControl: true
      });

      // Standard OpenStreetMap Tile Layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors • ParkPulse™ GIS',
        maxZoom: 19
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Clear previous markers
    Object.values(venueMarkersRef.current).forEach((m) => m.remove());
    venueMarkersRef.current = {};
    Object.values(zoneMarkersRef.current).forEach((m) => m.remove());
    zoneMarkersRef.current = {};
    if (connectionLineRef.current) {
      connectionLineRef.current.remove();
      connectionLineRef.current = null;
    }

    // 1. Add Parking Zone Markers (Emerald/Blue/Purple/Amber Styled Badges)
    PARKING_ZONES.forEach((zone) => {
      const avail = getZoneAvailableCount(zone.zoneKey);
      const total = getZoneTotalCount(zone.zoneKey);

      const zoneIcon = L.divIcon({
        className: 'custom-zone-marker',
        html: `
          <div style="
            display: flex;
            align-items: center;
            gap: 6px;
            background: #143d2b;
            color: white;
            padding: 6px 12px;
            border-radius: 9999px;
            box-shadow: 0 4px 14px rgba(0,0,0,0.25);
            border: 2px solid #52b788;
            font-family: inherit;
            font-size: 11px;
            font-weight: 700;
            white-space: nowrap;
            cursor: pointer;
            transform: translate(-50%, -50%);
          ">
            <span style="
              background: #52b788;
              color: #0b291d;
              width: 18px;
              height: 18px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 11px;
              font-weight: 900;
            ">P</span>
            <span>${zone.shortName}</span>
            <span style="
              background: ${avail > 0 ? '#10b981' : '#ef4444'};
              color: white;
              padding: 1px 6px;
              border-radius: 9999px;
              font-size: 9px;
              font-weight: 800;
            ">${avail} Free</span>
          </div>
        `,
        iconSize: [120, 36],
        iconAnchor: [60, 18]
      });

      const marker = L.marker([zone.lat, zone.lng], { icon: zoneIcon }).addTo(map);

      marker.bindPopup(`
        <div style="font-family: inherit; padding: 4px; font-size: 12px;">
          <h4 style="font-weight: 800; color: #143d2b; margin: 0 0 4px 0;">🅿️ ${zone.name}</h4>
          <p style="margin: 0 0 6px 0; color: #64748b; font-size: 11px;">${zone.description}</p>
          <div style="background: #f1f5f9; padding: 6px 8px; border-radius: 8px; font-size: 11px; font-weight: 600; display: flex; justify-content: space-between;">
            <span>Available Parking:</span>
            <b style="color: ${avail > 0 ? '#10b981' : '#ef4444'}">${avail} / ${total} Bays Free</b>
          </div>
        </div>
      `);

      zoneMarkersRef.current[zone.zoneKey] = marker;
    });

    // 2. Add Hotel & Cafe Markers
    NEARBY_PLACES.forEach((place) => {
      const isHotel = place.type === 'hotel';
      const isSelected = selectedPlace.id === place.id;

      const placeIcon = L.divIcon({
        className: 'custom-poi-marker',
        html: `
          <div style="
            display: flex;
            align-items: center;
            gap: 5px;
            background: ${isSelected ? '#0f172a' : '#ffffff'};
            color: ${isSelected ? '#ffffff' : '#1e293b'};
            padding: 5px 10px;
            border-radius: 9999px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            border: 2px solid ${isSelected ? '#f59e0b' : isHotel ? '#3b82f6' : '#d97706'};
            font-family: inherit;
            font-size: 11px;
            font-weight: 700;
            white-space: nowrap;
            cursor: pointer;
            transition: all 0.2s ease;
            transform: translate(-50%, -50%) ${isSelected ? 'scale(1.08)' : 'scale(1)'};
          ">
            <span>${isHotel ? '🏨' : '☕'}</span>
            <span>${place.name.split(' ')[0]} ${place.name.split(' ')[1] || ''}</span>
            <span style="color: #f59e0b; font-size: 10px;">★ ${place.rating}</span>
          </div>
        `,
        iconSize: [130, 32],
        iconAnchor: [65, 16]
      });

      const marker = L.marker([place.lat, place.lng], { icon: placeIcon }).addTo(map);

      marker.on('click', () => {
        handleSelectPlace(place);
      });

      marker.bindPopup(`
        <div style="font-family: inherit; padding: 4px; font-size: 12px; max-width: 200px;">
          <span style="font-size: 10px; text-transform: uppercase; font-weight: 800; color: ${isHotel ? '#3b82f6' : '#d97706'};">
            ${place.categoryLabel}
          </span>
          <h4 style="font-weight: 800; color: #0f172a; margin: 2px 0 4px 0;">${isHotel ? '🏨' : '☕'} ${place.name}</h4>
          <p style="margin: 0 0 6px 0; color: #64748b; font-size: 11px;">${place.address}</p>
          <div style="background: #eaf5ee; border: 1px solid #d1e7dd; padding: 5px 8px; border-radius: 8px; font-size: 11px;">
            <b style="color: #143d2b;">Nearest Parking:</b>
            <div style="color: #143d2b; font-weight: 700;">${place.nearestZoneName}</div>
            <div style="color: #52b788; font-size: 10px;">${place.distanceMeters}m away • ${place.walkingMinutes} min walk</div>
          </div>
        </div>
      `);

      venueMarkersRef.current[place.id] = marker;
    });

    // 3. Draw Connecting Line between selected place and its nearest parking zone
    const targetZone = PARKING_ZONES.find((z) => z.zoneKey === selectedPlace.nearestZoneKey);
    if (targetZone) {
      connectionLineRef.current = L.polyline(
        [
          [selectedPlace.lat, selectedPlace.lng],
          [targetZone.lat, targetZone.lng]
        ],
        {
          color: '#143d2b',
          weight: 3,
          dashArray: '6, 8',
          opacity: 0.85
        }
      ).addTo(map);
    }

    return () => {
      // Clean up map instance on unmount
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update map focus and connection line when selectedPlace changes
  const handleSelectPlace = (place: NearbyPlace) => {
    setSelectedPlace(place);

    const map = mapInstanceRef.current;
    if (!map) return;

    // Smoothly fly to the venue
    map.flyTo([place.lat, place.lng], 16.5, {
      animate: true,
      duration: 0.8
    });

    // Update connection line
    if (connectionLineRef.current) {
      connectionLineRef.current.remove();
    }
    const targetZone = PARKING_ZONES.find((z) => z.zoneKey === place.nearestZoneKey);
    if (targetZone) {
      connectionLineRef.current = L.polyline(
        [
          [place.lat, place.lng],
          [targetZone.lat, targetZone.lng]
        ],
        {
          color: '#143d2b',
          weight: 3,
          dashArray: '6, 8',
          opacity: 0.85
        }
      ).addTo(map);
    }

    // Open popup on marker
    const marker = venueMarkersRef.current[place.id];
    if (marker) {
      marker.openPopup();
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Feature Overview & Search Toolbar */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 rounded-2xl bg-emerald-50 text-[#143d2b] shadow-xs">
              <Compass className="w-6 h-6 text-emerald-700" />
            </span>
            <div>
              <h3 className="text-xl font-bold text-slate-900 leading-tight">
                Live Location & Nearby Venue Parking Navigator
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Powered by OpenStreetMap (OSM) • Select any Hotel or Café to auto-discover and reserve the closest available parking slot
              </p>
            </div>
          </div>
        </div>

        {/* Search & Category Filter Pills */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          {/* Search box */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search hotel, café, street..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#143d2b]/20 focus:border-[#143d2b]"
            />
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl">
            <button
              onClick={() => setActiveTypeFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTypeFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              All ({NEARBY_PLACES.length})
            </button>
            <button
              onClick={() => setActiveTypeFilter('hotel')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                activeTypeFilter === 'hotel'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <span>🏨</span>
              <span>Hotels</span>
            </button>
            <button
              onClick={() => setActiveTypeFilter('cafe')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                activeTypeFilter === 'cafe'
                  ? 'bg-white text-amber-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <span>☕</span>
              <span>Cafés</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Column (Map & Venue Selector) + Right Column (Nearest Available Parking Slots) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: OpenStreetMap Canvas & Venue Carousel (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Leaflet OSM Container */}
          <div className="bg-white rounded-3xl p-3 border border-slate-200/80 shadow-xs overflow-hidden relative">
            <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100 mb-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-slate-800">
                  OpenStreetMap Real-time GIS Layer
                </span>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-slate-500 font-medium">
                <span className="inline-flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#143d2b]" /> Parking Zones (🅿️)
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-blue-500" /> Hotels (🏨)
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500" /> Cafés (☕)
                </span>
              </div>
            </div>

            {/* Map Canvas */}
            <div
              ref={mapContainerRef}
              className="w-full h-[430px] rounded-2xl overflow-hidden z-10"
              style={{ minHeight: '430px' }}
            />

            {/* Floating Quick Dropdown on Map */}
            <div className="absolute bottom-6 left-6 right-6 z-20 pointer-events-auto bg-white/95 backdrop-blur-md p-3.5 rounded-2xl border border-slate-200 shadow-lg flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-lg shrink-0">
                  {selectedPlace.type === 'hotel' ? '🏨' : '☕'}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 truncate">
                    {selectedPlace.name}
                  </div>
                  <div className="text-[11px] text-slate-500 truncate">
                    {selectedPlace.address}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-[#143d2b] font-bold text-[11px] flex items-center gap-1">
                  <Navigation className="w-3 h-3" />
                  <span>{selectedPlace.distanceMeters}m to {selectedPlace.nearestZoneKey}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Horizontal Venue Cards Carousel (Click to Select) */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Select Destination Hotel or Café ({filteredPlaces.length})
              </h4>
              <span className="text-[11px] text-slate-400">Click any card to focus on map</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {filteredPlaces.map((place) => {
                const isSelected = selectedPlace.id === place.id;
                const isHotel = place.type === 'hotel';
                return (
                  <button
                    key={place.id}
                    onClick={() => handleSelectPlace(place)}
                    className={`p-3.5 rounded-2xl text-left border transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-[#143d2b] bg-emerald-50/60 ring-2 ring-[#143d2b]/20 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1.5">
                        <span className="text-base">{isHotel ? '🏨' : '☕'}</span>
                        <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-md">
                          ★ {place.rating}
                        </span>
                      </div>
                      <h5 className="text-xs font-bold text-slate-900 line-clamp-1">
                        {place.name}
                      </h5>
                      <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                        {place.categoryLabel}
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-semibold">
                      <span className="text-slate-600">🅿️ {place.nearestZoneKey}</span>
                      <span className="text-emerald-700 font-bold">{place.distanceMeters}m</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Available Parking Slots in the Nearest Zone (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Destination & Zone Highlight Banner */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-[#143d2b] to-[#1b4332] text-white shadow-md relative overflow-hidden">
            {/* Background pattern */}
            <div className="absolute right-0 top-0 bottom-0 w-32 bg-white/5 transform skew-x-12" />

            <div className="relative z-10 space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-full bg-white/20 text-emerald-200 text-[10px] font-bold uppercase tracking-wider">
                  Target Destination Selected
                </span>
                <span className="text-xs text-amber-300 font-bold flex items-center gap-1">
                  ★ {selectedPlace.rating} ({selectedPlace.reviewsCount} reviews)
                </span>
              </div>

              <div>
                <h3 className="text-xl font-black text-white flex items-center gap-2">
                  <span>{selectedPlace.type === 'hotel' ? '🏨' : '☕'}</span>
                  <span>{selectedPlace.name}</span>
                </h3>
                <p className="text-xs text-emerald-100/80 mt-1">
                  {selectedPlace.description}
                </p>
              </div>

              {/* Nearest Parking Zone Pill */}
              <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/15 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-emerald-200 font-bold uppercase block">
                    Closest Parking Zone
                  </span>
                  <span className="text-sm font-bold text-white block mt-0.5">
                    🅿️ {selectedPlace.nearestZoneName}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-base font-extrabold text-amber-300 block">
                    {selectedPlace.distanceMeters} meters
                  </span>
                  <span className="text-[10px] text-emerald-200 font-medium">
                    ~{selectedPlace.walkingMinutes} min walking distance
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Available Slots Section */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-base font-bold text-slate-900">
                  Available Parking Slots
                </h4>
                <p className="text-xs text-slate-500">
                  {availableSlotsInZone.length} bays ready to book in {selectedPlace.nearestZoneName}
                </p>
              </div>

              {/* Vehicle Type Filter */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                <button
                  onClick={() => setVehicleFilter('all')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    vehicleFilter === 'all'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setVehicleFilter('Car')}
                  className={`px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                    vehicleFilter === 'Car'
                      ? 'bg-white text-[#143d2b] shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <Car className="w-3.5 h-3.5" />
                  <span>Car</span>
                </button>
                <button
                  onClick={() => setVehicleFilter('Bike')}
                  className={`px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                    vehicleFilter === 'Bike'
                      ? 'bg-white text-[#143d2b] shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <Bike className="w-3.5 h-3.5" />
                  <span>Bike</span>
                </button>
              </div>
            </div>

            {/* List of Available Slots */}
            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {availableSlotsInZone.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                    <Info className="w-5 h-5" />
                  </div>
                  <h5 className="text-xs font-bold text-slate-800">
                    No {vehicleFilter !== 'all' ? vehicleFilter : ''} slots available right now in {selectedPlace.nearestZoneName}
                  </h5>
                  <p className="text-[11px] text-slate-500">
                    Try selecting another nearby hotel or switch vehicle type filter above.
                  </p>
                </div>
              ) : (
                availableSlotsInZone.map((slot) => (
                  <div
                    key={slot.id}
                    className="p-4 rounded-2xl border border-slate-200/80 hover:border-emerald-500 bg-white hover:bg-emerald-50/20 transition-all flex items-center justify-between gap-3 shadow-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-[#143d2b] flex items-center justify-center shrink-0">
                        {slot.vehicle_type === 'Car' ? (
                          <Car className="w-5 h-5" />
                        ) : (
                          <Bike className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h5 className="font-extrabold text-slate-900 text-sm">
                            Slot #{slot.slot_number}
                          </h5>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            Available
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                          <span>{slot.vehicle_type}</span>
                          <span>•</span>
                          <span className="font-bold text-[#143d2b]">₹{slot.hourly_rate.toFixed(2)}/hr</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => onBookSlot(slot)}
                      className="py-2 px-3.5 rounded-xl bg-[#143d2b] hover:bg-[#1b4332] active:scale-95 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all hover:shadow cursor-pointer shrink-0"
                    >
                      <span>Book Slot</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Quick Helper Note */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                Booking from this map reserves your spot immediately at <b>{selectedPlace.nearestZoneName}</b>, just <b>{selectedPlace.distanceMeters}m</b> from <b>{selectedPlace.name}</b>.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
