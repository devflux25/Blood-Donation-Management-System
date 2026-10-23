import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';
import { Donation, Donor } from '../types';
import { Plus, Check, AlertCircle, X } from 'lucide-react';
import { formatApiError } from '../utils/errorHandler';

export const Donations: React.FC = () => {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [donors, setDonors] = useState<Donor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    donor_id: 1,
    donation_date: new Date().toISOString().split('T')[0],
    blood_group: 'O+',
    component_type: 'Whole Blood',
    units: 1,
    hemoglobin_g_dl: 14.0,
    blood_pressure: '120/80',
    pulse_rate: 72,
    screening_status: 'Passed',
    status: 'Completed',
    remarks: 'Routine center voluntary donation'
  });

  useEffect(() => {
    fetchDonations();
    fetchDonorsList();
  }, []);

  const fetchDonations = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/donations');
      setDonations(res.data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDonorsList = async () => {
    try {
      const res = await apiClient.get('/donors?limit=100');
      setDonors(res.data);
      if (res.data.length > 0) {
        setFormData((prev) => ({
          ...prev,
          donor_id: res.data[0].id,
          blood_group: res.data[0].blood_group
        }));
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleDonorSelect = (donorId: number) => {
    const selected = donors.find((d) => d.id === donorId);
    setFormData((prev) => ({
      ...prev,
      donor_id: donorId,
      blood_group: selected ? selected.blood_group : prev.blood_group
    }));
  };

  const handleCreateDonation = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await apiClient.post('/donations', formData);
      setShowModal(false);
      fetchDonations();
    } catch (err: any) {
      setError(formatApiError(err, 'Failed to record donation.'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Donation Management</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Log medical donor vitals, screenings, and generate cold-chain inventory batches
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center justify-center px-4 py-2 bg-red-700 text-white rounded-lg text-sm font-medium hover:bg-red-800 shadow-sm transition"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Record Donation
        </button>
      </div>

      {/* Donations Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
              <tr>
                <th className="px-5 py-3.5">Donation Code</th>
                <th className="px-5 py-3.5">Donor</th>
                <th className="px-5 py-3.5">Blood Group</th>
                <th className="px-5 py-3.5">Component</th>
                <th className="px-5 py-3.5">Date</th>
                <th className="px-5 py-3.5">Screening</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Inventory</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-slate-500">
                    Loading donation history...
                  </td>
                </tr>
              ) : donations.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-slate-500">
                    No donation records logged.
                  </td>
                </tr>
              ) : (
                donations.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50 transition">
                    <td className="px-5 py-3 font-mono font-medium text-slate-900">{d.donation_code}</td>
                    <td className="px-5 py-3 font-medium text-slate-900">{d.donor_name || `Donor #${d.donor_id}`}</td>
                    <td className="px-5 py-3">
                      <span className="inline-block px-2 py-0.5 font-bold rounded bg-red-100 text-red-800 text-xs">
                        {d.blood_group}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-600">{d.component_type}</td>
                    <td className="px-5 py-3 text-slate-600">{d.donation_date}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                        d.screening_status === 'Passed' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {d.screening_status}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                        d.status === 'Completed' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {d.status}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      {d.inventory_generated ? (
                        <span className="text-emerald-700 font-semibold text-xs flex items-center">
                          <Check className="w-3.5 h-3.5 mr-1" /> Added to Stock
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">Pending Batch</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Donation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 border border-slate-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Record Voluntary Donation</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mt-3 bg-red-50 text-red-700 text-xs p-3 rounded flex items-center">
                <AlertCircle className="w-4 h-4 mr-2 shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleCreateDonation} className="mt-4 space-y-3.5 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700">Select Donor *</label>
                <select
                  value={formData.donor_id}
                  onChange={(e) => handleDonorSelect(Number(e.target.value))}
                  className="mt-1 w-full border border-slate-300 rounded px-3 py-1.5 text-sm bg-white"
                >
                  {donors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.full_name} ({d.blood_group}) - {d.phone}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Component *</label>
                  <select
                    value={formData.component_type}
                    onChange={(e) => setFormData({ ...formData, component_type: e.target.value })}
                    className="mt-1 w-full border border-slate-300 rounded px-3 py-1.5 text-sm bg-white"
                  >
                    <option value="Whole Blood">Whole Blood</option>
                    <option value="Red Blood Cells">Red Blood Cells</option>
                    <option value="Platelets">Platelets</option>
                    <option value="Plasma">Plasma</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Donation Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.donation_date}
                    onChange={(e) => setFormData({ ...formData, donation_date: e.target.value })}
                    className="mt-1 w-full border border-slate-300 rounded px-3 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Hemoglobin (g/dL)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.hemoglobin_g_dl}
                    onChange={(e) => setFormData({ ...formData, hemoglobin_g_dl: Number(e.target.value) })}
                    className="mt-1 w-full border border-slate-300 rounded px-3 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Blood Pressure</label>
                  <input
                    type="text"
                    value={formData.blood_pressure}
                    onChange={(e) => setFormData({ ...formData, blood_pressure: e.target.value })}
                    className="mt-1 w-full border border-slate-300 rounded px-3 py-1.5 text-sm"
                    placeholder="120/80"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Screening Outcome</label>
                  <select
                    value={formData.screening_status}
                    onChange={(e) => setFormData({ ...formData, screening_status: e.target.value })}
                    className="mt-1 w-full border border-slate-300 rounded px-3 py-1.5 text-sm bg-white"
                  >
                    <option value="Passed">Passed (Eligible)</option>
                    <option value="Deferred">Deferred</option>
                    <option value="Failed">Failed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="mt-1 w-full border border-slate-300 rounded px-3 py-1.5 text-sm bg-white"
                  >
                    <option value="Completed">Completed (Auto-generate Batch)</option>
                    <option value="Scheduled">Scheduled</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-700 text-white rounded-lg text-xs font-medium hover:bg-red-800"
                >
                  Confirm & Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
