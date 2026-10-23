import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';
import { Donor } from '../types';
import { Plus, Search, Check, X, AlertCircle } from 'lucide-react';
import { formatApiError } from '../utils/errorHandler';

export const Donors: React.FC = () => {
  const [donors, setDonors] = useState<Donor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [isEligible, setIsEligible] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    date_of_birth: '1995-01-01',
    gender: 'Male',
    blood_group: 'O+',
    address: '',
    city: '',
    is_eligible: true,
    notes: ''
  });

  useEffect(() => {
    fetchDonors();
  }, [bloodGroup, isEligible]);

  const fetchDonors = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (search) params.search = search;
      if (bloodGroup) params.blood_group = bloodGroup;
      if (isEligible !== '') params.is_eligible = isEligible === 'true';

      const res = await apiClient.get('/donors', { params });
      setDonors(res.data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchDonors();
  };

  const handleCreateDonor = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      const payload = {
        ...formData,
        email: formData.email.trim() ? formData.email.trim() : null,
        address: formData.address.trim() ? formData.address.trim() : null,
        notes: formData.notes.trim() ? formData.notes.trim() : null
      };
      const res = await apiClient.post('/donors', payload);
      setShowModal(false);
      setSuccess(`Donor ${res.data.full_name} (${res.data.donor_code}) registered successfully!`);
      setTimeout(() => setSuccess(null), 4000);
      setFormData({
        full_name: '',
        email: '',
        phone: '',
        date_of_birth: '1995-01-01',
        gender: 'Male',
        blood_group: 'O+',
        address: '',
        city: '',
        is_eligible: true,
        notes: ''
      });
      fetchDonors();
    } catch (err: any) {
      setError(formatApiError(err, 'Failed to register donor.'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Donor Management</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Register voluntary blood donors, inspect donation histories, and verify eligibility
          </p>
        </div>
        <button
          onClick={() => {
            setError(null);
            setShowModal(true);
          }}
          className="inline-flex items-center justify-center px-4 py-2 bg-red-700 text-white rounded-lg text-sm font-medium hover:bg-red-800 shadow-sm transition"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Add New Donor
        </button>
      </div>

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm p-3 rounded-lg flex items-center">
          <Check className="w-4 h-4 mr-2 text-emerald-600 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, donor code, phone, or city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600"
          />
        </form>
        <div className="flex gap-2">
          <select
            value={bloodGroup}
            onChange={(e) => setBloodGroup(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-600"
          >
            <option value="">All Blood Groups</option>
            {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
              <option key={bg} value={bg}>{bg}</option>
            ))}
          </select>

          <select
            value={isEligible}
            onChange={(e) => setIsEligible(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-600"
          >
            <option value="">All Eligibility</option>
            <option value="true">Eligible Only</option>
            <option value="false">Deferred / Ineligible</option>
          </select>
        </div>
      </div>

      {/* Donors Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
              <tr>
                <th className="px-5 py-3.5">Code</th>
                <th className="px-5 py-3.5">Donor Name</th>
                <th className="px-5 py-3.5">Blood Group</th>
                <th className="px-5 py-3.5">Phone / Contact</th>
                <th className="px-5 py-3.5">City</th>
                <th className="px-5 py-3.5">Eligibility</th>
                <th className="px-5 py-3.5">Last Donated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-500">
                    Loading donors...
                  </td>
                </tr>
              ) : donors.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-500">
                    No donor records found matching criteria.
                  </td>
                </tr>
              ) : (
                donors.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50 transition">
                    <td className="px-5 py-3 font-mono font-medium text-slate-900">{d.donor_code}</td>
                    <td className="px-5 py-3 font-medium text-slate-900">{d.full_name}</td>
                    <td className="px-5 py-3">
                      <span className="inline-block px-2 py-0.5 font-bold rounded bg-red-100 text-red-800 text-xs">
                        {d.blood_group}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-600">{d.phone}</td>
                    <td className="px-5 py-3 text-slate-600">{d.city}</td>
                    <td className="px-5 py-3">
                      {d.is_eligible ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                          <Check className="w-3 h-3 mr-1" /> Eligible
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                          <X className="w-3 h-3 mr-1" /> Deferred
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-slate-500">
                      {d.last_donation_date || 'Never'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Dialog for Registration */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 border border-slate-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Register Voluntary Donor</h3>
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

            <form onSubmit={handleCreateDonor} className="mt-4 space-y-3.5 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="mt-1 w-full border border-slate-300 rounded px-3 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Email Address (Optional)</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="mt-1 w-full border border-slate-300 rounded px-3 py-1.5 text-sm"
                    placeholder="donor@example.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="mt-1 w-full border border-slate-300 rounded px-3 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Blood Group *</label>
                  <select
                    value={formData.blood_group}
                    onChange={(e) => setFormData({ ...formData, blood_group: e.target.value })}
                    className="mt-1 w-full border border-slate-300 rounded px-3 py-1.5 text-sm bg-white"
                  >
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Date of Birth *</label>
                  <input
                    type="date"
                    required
                    value={formData.date_of_birth}
                    onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                    className="mt-1 w-full border border-slate-300 rounded px-3 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Gender *</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="mt-1 w-full border border-slate-300 rounded px-3 py-1.5 text-sm bg-white"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700">City *</label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="mt-1 w-full border border-slate-300 rounded px-3 py-1.5 text-sm"
                  />
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
                  Save Donor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
