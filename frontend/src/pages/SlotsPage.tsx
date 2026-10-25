import React, { useState } from 'react';
import {
  Car,
  Bike,
  Plus,
  Filter,
  LayoutGrid,
  Columns3,
  Table as TableIcon,
  Search,
  CheckCircle2,
  AlertTriangle,
  Wrench,
  Clock,
  ArrowRight,
  MapPin
} from 'lucide-react';
import { ParkingSlot } from '../types';
import { SlotCard } from '../components/SlotCard';
import { ParkingLocationMapView } from '../components/ParkingLocationMapView';

interface SlotsPageProps {
  slots: ParkingSlot[];
  onBookSlot: (slot: ParkingSlot) => void;
  onAddSlot: () => void;
  onEditSlot: (slot: ParkingSlot) => void;
  onStatusChange: (slot: ParkingSlot, status: string) => void;
  isAdmin?: boolean;
}

export const SlotsPage: React.FC<SlotsPageProps> = ({
  slots,
  onBookSlot,
  onAddSlot,
  onEditSlot,
  onStatusChange,
  isAdmin = false
}) => {
  const [viewMode, setViewMode] = useState<'columns' | 'grid' | 'table' | 'map'>('columns');
  const [vehicleFilter, setVehicleFilter] = useState<'all' | 'Car' | 'Bike'>('all');
  const [zoneFilter, setZoneFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter slots based on controls
  const filteredSlots = slots.filter((slot) => {
    if (vehicleFilter !== 'all' && slot.vehicle_type !== vehicleFilter) return false;
    if (zoneFilter !== 'all' && !slot.location_zone.toLowerCase().includes(zoneFilter.toLowerCase())) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchSlot = slot.slot_number.toLowerCase().includes(q);
      const matchZone = slot.location_zone.toLowerCase().includes(q);
      const matchVehicle = (slot.current_vehicle || '').toLowerCase().includes(q);
      if (!matchSlot && !matchZone && !matchVehicle) return false;
    }
    return true;
  });

  // Separate slots into the 3 columns matching screenshot
  const availableSlots = filteredSlots.filter(s => s.status === 'Available');
  const occupiedSlots = filteredSlots.filter(s => s.status === 'Occupied');
  const maintenanceSlots = filteredSlots.filter(s => s.status === 'Maintenance');

  return (
    <div className="space-y-6">
      {/* Sub-toolbar with filters & view toggles */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Vehicle Type Filter Pills */}
          <button
            onClick={() => setVehicleFilter('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              vehicleFilter === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Types ({slots.length})
          </button>
          <button
            onClick={() => setVehicleFilter('Car')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
              vehicleFilter === 'Car'
                ? 'bg-[#143d2b] text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Car className="w-3.5 h-3.5" />
            <span>Cars ({slots.filter(s => s.vehicle_type === 'Car').length})</span>
          </button>
          <button
            onClick={() => setVehicleFilter('Bike')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
              vehicleFilter === 'Bike'
                ? 'bg-[#143d2b] text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Bike className="w-3.5 h-3.5" />
            <span>Bikes ({slots.filter(s => s.vehicle_type === 'Bike').length})</span>
          </button>

          {/* Zone Selector */}
          <select
            value={zoneFilter}
            onChange={(e) => setZoneFilter(e.target.value)}
            className="px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-100 border-none text-slate-700 focus:ring-2 focus:ring-[#143d2b]"
          >
            <option value="all">All Zones</option>
            <option value="Zone A">Zone A (North Wing)</option>
            <option value="Zone B">Zone B (South Plaza)</option>
            <option value="Zone C">Zone C (Basement EV)</option>
            <option value="Zone D">Zone D (East Tower)</option>
          </select>
        </div>

        {/* View Switcher: Columns / Grid / Table */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setViewMode('columns')}
            title="Columns Kanban View (Screenshot Layout)"
            className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
              viewMode === 'columns'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Columns3 className="w-4 h-4" />
            <span className="hidden sm:inline">Columns</span>
          </button>
          <button
            onClick={() => setViewMode('grid')}
            title="Grid Cards View"
            className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
              viewMode === 'grid'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            <span className="hidden sm:inline">Grid</span>
          </button>
          <button
            onClick={() => setViewMode('table')}
            title="Data Table View"
            className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
              viewMode === 'table'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <TableIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Table</span>
          </button>
          <button
            onClick={() => setViewMode('map')}
            title="OpenStreetMap Nearby Hotels & Cafes View"
            className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              viewMode === 'map'
                ? 'bg-[#143d2b] text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span className="hidden sm:inline">🗺️ OSM Map & Venues</span>
          </button>
        </div>
      </div>

      {/* VIEW MODE 1: Columns Layout (Exactly matching the user's reference screenshot) */}
      {viewMode === 'columns' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Column 1: Available (Green dot matching screenshot's "Delivered") */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-xs" />
                <h3 className="text-sm font-bold text-slate-900">Available Slots</h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                {availableSlots.length}
              </span>
            </div>

            <div className="space-y-4">
              {availableSlots.length === 0 ? (
                <div className="p-8 rounded-3xl border border-dashed border-slate-200 bg-white/50 text-center text-xs text-slate-400">
                  No available slots in this zone.
                </div>
              ) : (
                availableSlots.map((slot) => (
                  <SlotCard
                    key={slot.id}
                    slot={slot}
                    onBook={onBookSlot}
                    onStatusChange={onStatusChange}
                    onEdit={onEditSlot}
                    isAdmin={isAdmin}
                  />
                ))
              )}
            </div>
          </div>

          {/* Column 2: Occupied (Orange dot matching screenshot's "Picked up") */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-xs" />
                <h3 className="text-sm font-bold text-slate-900">Occupied Slots</h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-bold">
                {occupiedSlots.length}
              </span>
            </div>

            <div className="space-y-4">
              {occupiedSlots.length === 0 ? (
                <div className="p-8 rounded-3xl border border-dashed border-slate-200 bg-white/50 text-center text-xs text-slate-400">
                  No occupied slots currently.
                </div>
              ) : (
                occupiedSlots.map((slot) => (
                  <SlotCard
                    key={slot.id}
                    slot={slot}
                    onBook={onBookSlot}
                    onStatusChange={onStatusChange}
                    onEdit={onEditSlot}
                    isAdmin={isAdmin}
                  />
                ))
              )}
            </div>
          </div>

          {/* Column 3: Maintenance / Under Review (Blue dot matching screenshot's "In transit") */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-xs" />
                <h3 className="text-sm font-bold text-slate-900">Maintenance & Prep</h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-bold">
                {maintenanceSlots.length}
              </span>
            </div>

            <div className="space-y-4">
              {maintenanceSlots.length === 0 ? (
                <div className="p-8 rounded-3xl border border-dashed border-slate-200 bg-white/50 text-center text-xs text-slate-400">
                  All systems operational. No maintenance.
                </div>
              ) : (
                maintenanceSlots.map((slot) => (
                  <SlotCard
                    key={slot.id}
                    slot={slot}
                    onBook={onBookSlot}
                    onStatusChange={onStatusChange}
                    onEdit={onEditSlot}
                    isAdmin={isAdmin}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODE 2: Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredSlots.map((slot) => (
            <SlotCard
              key={slot.id}
              slot={slot}
              onBook={onBookSlot}
              onStatusChange={onStatusChange}
              onEdit={onEditSlot}
              isAdmin={isAdmin}
            />
          ))}
        </div>
      )}

      {/* VIEW MODE 3: Detailed Table View */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Slot Number</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Location Zone</th>
                  <th className="py-3.5 px-4">Hourly Rate</th>
                  <th className="py-3.5 px-4">Current Status</th>
                  <th className="py-3.5 px-4">Occupant / Reg</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {filteredSlots.map((slot) => (
                  <tr key={slot.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">#{slot.slot_number}</td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1">
                        {slot.vehicle_type === 'Car' ? '🚘 Car' : '🏍️ Bike'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{slot.location_zone}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">₹{slot.hourly_rate.toFixed(2)}/hr</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          slot.status === 'Available'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : slot.status === 'Occupied'
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-blue-50 text-blue-800 border border-blue-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            slot.status === 'Available'
                              ? 'bg-emerald-500'
                              : slot.status === 'Occupied'
                              ? 'bg-amber-500'
                              : 'bg-blue-500'
                          }`}
                        />
                        {slot.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">
                      {slot.current_vehicle || '--'}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      {slot.status === 'Available' && (
                        <button
                          onClick={() => onBookSlot(slot)}
                          className="px-3 py-1 rounded-full bg-[#143d2b] text-white font-semibold hover:bg-[#1b4332]"
                        >
                          Book
                        </button>
                      )}
                      <button
                        onClick={() => onEditSlot(slot)}
                        className="px-2.5 py-1 rounded-full border border-slate-200 hover:bg-slate-100 text-slate-600"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW MODE 4: OpenStreetMap Location & Nearby Places View */}
      {viewMode === 'map' && (
        <ParkingLocationMapView
          slots={slots}
          onBookSlot={onBookSlot}
          isAdmin={isAdmin}
        />
      )}
    </div>
  );
};
