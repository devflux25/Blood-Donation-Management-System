import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';
import { DonationEvent, Donor } from '../types';
import { Plus, Calendar, MapPin, Users, X, AlertCircle } from 'lucide-react';
import { formatApiError } from '../utils/errorHandler';

export const Events: React.FC = () => {
  const [events, setEvents] = useState<DonationEvent[]>([]);
  const [donors, setDonors] = useState<Donor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showRegModal, setShowRegModal] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [selectedDonorId, setSelectedDonorId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [eventForm, setEventForm] = useState({
    title: '',
    organizer: '',
    venue: '',
    city: '',
    event_date: new Date().toISOString().split('T')[0],
    start_time: '09:00:00',
    end_time: '16:00:00',
    capacity: 100,
    status: 'Upcoming',
    description: ''
  });

  useEffect(() => {
    fetchEvents();
    fetchDonors();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/events');
      setEvents(res.data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDonors = async () => {
    try {
      const res = await apiClient.get('/donors?limit=100');
      setDonors(res.data);
      if (res.data.length > 0) setSelectedDonorId(res.data[0].id);
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await apiClient.post('/events', eventForm);
      setShowEventModal(false);
      fetchEvents();
    } catch (err: any) {
      setError(formatApiError(err, 'Failed to schedule event.'));
    }
  };

  const openRegisterModal = (eventId: number) => {
    setSelectedEventId(eventId);
    setError(null);
    setShowRegModal(true);
  };

  const handleRegisterDonor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventId || !selectedDonorId) return;
    setError(null);
    try {
      await apiClient.post('/events/register', {
        event_id: selectedEventId,
        donor_id: selectedDonorId
      });
      setShowRegModal(false);
      fetchEvents();
    } catch (err: any) {
      setError(formatApiError(err, 'Failed to register donor.'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Donation Camps & Community Events</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Organize mobile blood drives, manage venue capacities, and coordinate donor pre-registrations
          </p>
        </div>
        <button
          onClick={() => setShowEventModal(true)}
          className="inline-flex items-center justify-center px-4 py-2 bg-red-700 text-white rounded-lg text-sm font-medium hover:bg-red-800 shadow-sm transition"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Schedule Event
        </button>
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center py-12 text-slate-500">Loading events...</div>
        ) : events.length === 0 ? (
          <div className="col-span-full text-center py-12 text-slate-500">No scheduled donation events.</div>
        ) : (
          events.map((evt) => (
            <div key={evt.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start">
                  <span className="font-mono text-xs text-slate-500 font-semibold">{evt.event_code}</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                    evt.status === 'Completed' ? 'bg-slate-100 text-slate-700' :
                    evt.status === 'Ongoing' ? 'bg-emerald-100 text-emerald-800 animate-pulse' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {evt.status}
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 text-base mt-2">{evt.title}</h3>
                <p className="text-xs text-red-700 font-medium mt-0.5">Organizer: {evt.organizer}</p>

                <div className="mt-4 space-y-2 text-xs text-slate-600">
                  <div className="flex items-center">
                    <Calendar className="w-3.5 h-3.5 mr-2 text-slate-400" />
                    <span>{evt.event_date} ({evt.start_time.slice(0, 5)} - {evt.end_time.slice(0, 5)})</span>
                  </div>
                  <div className="flex items-center">
                    <MapPin className="w-3.5 h-3.5 mr-2 text-slate-400" />
                    <span className="truncate">{evt.venue}, {evt.city}</span>
                  </div>
                  <div className="flex items-center">
                    <Users className="w-3.5 h-3.5 mr-2 text-slate-400" />
                    <span>{evt.registered_count} / {evt.capacity} Registered Participants</span>
                  </div>
                </div>

                {evt.description && (
                  <p className="mt-3 text-xs text-slate-500 bg-slate-50 p-2.5 rounded border border-slate-100 line-clamp-2">
                    {evt.description}
                  </p>
                )}
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => openRegisterModal(evt.id)}
                  disabled={evt.status === 'Completed' || evt.registered_count >= evt.capacity}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white rounded text-xs font-medium transition"
                >
                  Register Donor
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Schedule Event Modal */}
      {showEventModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 border border-slate-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Schedule Donation Drive</h3>
              <button onClick={() => setShowEventModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mt-3 bg-red-50 text-red-700 text-xs p-3 rounded flex items-center">
                <AlertCircle className="w-4 h-4 mr-2 shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleCreateEvent} className="mt-4 space-y-3.5 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700">Event Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. City Tech Park Voluntary Blood Drive"
                  value={eventForm.title}
                  onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                  className="mt-1 w-full border border-slate-300 rounded px-3 py-1.5 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Organizer Name *</label>
                  <input
                    type="text"
                    required
                    value={eventForm.organizer}
                    onChange={(e) => setEventForm({ ...eventForm, organizer: e.target.value })}
                    className="mt-1 w-full border border-slate-300 rounded px-3 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">City *</label>
                  <input
                    type="text"
                    required
                    value={eventForm.city}
                    onChange={(e) => setEventForm({ ...eventForm, city: e.target.value })}
                    className="mt-1 w-full border border-slate-300 rounded px-3 py-1.5 text-sm"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700">Venue / Location *</label>
                  <input
                    type="text"
                    required
                    value={eventForm.venue}
                    onChange={(e) => setEventForm({ ...eventForm, venue: e.target.value })}
                    className="mt-1 w-full border border-slate-300 rounded px-3 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Date *</label>
                  <input
                    type="date"
                    required
                    value={eventForm.event_date}
                    onChange={(e) => setEventForm({ ...eventForm, event_date: e.target.value })}
                    className="mt-1 w-full border border-slate-300 rounded px-3 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Capacity *</label>
                  <input
                    type="number"
                    min="10"
                    required
                    value={eventForm.capacity}
                    onChange={(e) => setEventForm({ ...eventForm, capacity: Number(e.target.value) })}
                    className="mt-1 w-full border border-slate-300 rounded px-3 py-1.5 text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEventModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-700 text-white rounded-lg text-xs font-medium hover:bg-red-800"
                >
                  Create Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Register Donor Modal */}
      {showRegModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 border border-slate-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Pre-Register Donor</h3>
              <button onClick={() => setShowRegModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mt-3 bg-red-50 text-red-700 text-xs p-3 rounded flex items-center">
                <AlertCircle className="w-4 h-4 mr-2 shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleRegisterDonor} className="mt-4 space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700">Select Donor</label>
                <select
                  value={selectedDonorId || ''}
                  onChange={(e) => setSelectedDonorId(Number(e.target.value))}
                  className="mt-1 w-full border border-slate-300 rounded px-3 py-1.5 text-sm bg-white"
                >
                  {donors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.full_name} ({d.blood_group})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowRegModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-700 text-white rounded-lg text-xs font-medium hover:bg-red-800"
                >
                  Confirm Registration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
