import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';
import { BloodRequest, Hospital } from '../types';
import { Plus, Send, AlertCircle, X, ShieldAlert } from 'lucide-react';
import { formatApiError } from '../utils/errorHandler';

export const Requests: React.FC = () => {
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<BloodRequest | null>(null);
  const [issueQty, setIssueQty] = useState(1);
  const [recipientName, setRecipientName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    hospital_id: 1,
    patient_name: '',
    blood_group: 'O+',
    component_type: 'Whole Blood',
    units_requested: 2,
    urgency: 'Normal',
    required_date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  useEffect(() => {
    fetchRequests();
    fetchHospitals();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/requests');
      setRequests(res.data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchHospitals = async () => {
    try {
      const res = await apiClient.get('/hospitals');
      setHospitals(res.data);
      if (res.data.length > 0) {
        setFormData((prev) => ({ ...prev, hospital_id: res.data[0].id }));
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await apiClient.post('/requests', formData);
      setShowCreateModal(false);
      fetchRequests();
    } catch (err: any) {
      setError(formatApiError(err, 'Failed to submit blood request.'));
    }
  };

  const openIssueModal = (req: BloodRequest) => {
    setSelectedRequest(req);
    const unfulfilled = req.units_requested - req.units_fulfilled;
    setIssueQty(unfulfilled > 0 ? unfulfilled : 1);
    setRecipientName('');
    setError(null);
    setShowIssueModal(true);
  };

  const handleIssueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;
    setError(null);
    try {
      await apiClient.post('/issues', {
        request_id: selectedRequest.id,
        units_to_issue: Number(issueQty),
        recipient_name: recipientName,
        notes: `Issued to hospital staff: ${recipientName}`
      });
      setShowIssueModal(false);
      fetchRequests();
    } catch (err: any) {
      setError(formatApiError(err, 'Blood issue transaction failed.'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Hospital Blood Requests & Issuing</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Process orders, approve units, and issue batch-traceable blood directly to hospitals
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center justify-center px-4 py-2 bg-red-700 text-white rounded-lg text-sm font-medium hover:bg-red-800 shadow-sm transition"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Create Blood Request
        </button>
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
              <tr>
                <th className="px-5 py-3.5">Code</th>
                <th className="px-5 py-3.5">Hospital</th>
                <th className="px-5 py-3.5">Patient</th>
                <th className="px-5 py-3.5">Blood Group</th>
                <th className="px-5 py-3.5">Requested / Fulfilled</th>
                <th className="px-5 py-3.5">Urgency</th>
                <th className="px-5 py-3.5">Required Date</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-5 py-8 text-center text-slate-500">
                    Loading blood requests...
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-5 py-8 text-center text-slate-500">
                    No active hospital blood requests.
                  </td>
                </tr>
              ) : (
                requests.map((r) => {
                  const isFulfilled = r.units_fulfilled >= r.units_requested;
                  return (
                    <tr key={r.id} className="hover:bg-slate-50 transition">
                      <td className="px-5 py-3 font-mono font-medium text-slate-900">{r.request_code}</td>
                      <td className="px-5 py-3 font-medium text-slate-900">{r.hospital_name}</td>
                      <td className="px-5 py-3 text-slate-600">{r.patient_name || 'N/A'}</td>
                      <td className="px-5 py-3">
                        <span className="inline-block px-2 py-0.5 font-bold rounded bg-red-100 text-red-800 text-xs">
                          {r.blood_group}
                        </span>
                      </td>
                      <td className="px-5 py-3 font-semibold text-slate-800">
                        {r.units_fulfilled} / {r.units_requested} Units
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                          r.urgency === 'Critical' ? 'bg-red-100 text-red-800' :
                          r.urgency === 'Urgent' ? 'bg-amber-100 text-amber-800' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {r.urgency}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-slate-600">{r.required_date}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                          r.status === 'Fulfilled' ? 'bg-emerald-100 text-emerald-800' :
                          r.status === 'Partially Fulfilled' ? 'bg-blue-100 text-blue-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        {!isFulfilled && (
                          <button
                            onClick={() => openIssueModal(r)}
                            className="inline-flex items-center px-3 py-1 bg-red-700 hover:bg-red-800 text-white rounded text-xs font-semibold transition"
                          >
                            <Send className="w-3 h-3 mr-1" />
                            Issue Blood
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Request Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 border border-slate-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">New Hospital Blood Request</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mt-3 bg-red-50 text-red-700 text-xs p-3 rounded flex items-center">
                <AlertCircle className="w-4 h-4 mr-2 shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleCreateRequest} className="mt-4 space-y-3.5 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700">Requesting Hospital *</label>
                <select
                  value={formData.hospital_id}
                  onChange={(e) => setFormData({ ...formData, hospital_id: Number(e.target.value) })}
                  className="mt-1 w-full border border-slate-300 rounded px-3 py-1.5 text-sm bg-white"
                >
                  {hospitals.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name} - {h.city}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
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
                  <label className="block text-xs font-semibold text-slate-700">Units Needed *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.units_requested}
                    onChange={(e) => setFormData({ ...formData, units_requested: Number(e.target.value) })}
                    className="mt-1 w-full border border-slate-300 rounded px-3 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Urgency Level</label>
                  <select
                    value={formData.urgency}
                    onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}
                    className="mt-1 w-full border border-slate-300 rounded px-3 py-1.5 text-sm bg-white"
                  >
                    <option value="Normal">Normal</option>
                    <option value="Urgent">Urgent</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Required Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.required_date}
                    onChange={(e) => setFormData({ ...formData, required_date: e.target.value })}
                    className="mt-1 w-full border border-slate-300 rounded px-3 py-1.5 text-sm"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700">Patient Name (Optional)</label>
                  <input
                    type="text"
                    value={formData.patient_name}
                    onChange={(e) => setFormData({ ...formData, patient_name: e.target.value })}
                    className="mt-1 w-full border border-slate-300 rounded px-3 py-1.5 text-sm"
                    placeholder="e.g. John Doe (ICU)"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-700 text-white rounded-lg text-xs font-medium hover:bg-red-800"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transactional Blood Issue Modal */}
      {showIssueModal && selectedRequest && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-slate-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Authorize Blood Issue</h3>
              <button onClick={() => setShowIssueModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mt-3 bg-red-50 text-red-700 text-xs p-3 rounded flex items-center">
                <AlertCircle className="w-4 h-4 mr-2 shrink-0" />
                {error}
              </div>
            )}

            <div className="my-3 p-3 bg-slate-50 rounded border border-slate-200 text-xs text-slate-700 space-y-1">
              <p><span className="font-semibold">Request:</span> {selectedRequest.request_code}</p>
              <p><span className="font-semibold">Hospital:</span> {selectedRequest.hospital_name}</p>
              <p><span className="font-semibold">Blood Group:</span> {selectedRequest.blood_group} ({selectedRequest.component_type})</p>
              <p><span className="font-semibold">Unfulfilled Balance:</span> {selectedRequest.units_requested - selectedRequest.units_fulfilled} Units</p>
            </div>

            <form onSubmit={handleIssueSubmit} className="space-y-3.5 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700">Units to Issue Now *</label>
                <input
                  type="number"
                  min="1"
                  max={selectedRequest.units_requested - selectedRequest.units_fulfilled}
                  required
                  value={issueQty}
                  onChange={(e) => setIssueQty(Number(e.target.value))}
                  className="mt-1 w-full border border-slate-300 rounded px-3 py-1.5 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Authorized Recipient / Nurse Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Nurse Sarah (Trauma Desk)"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="mt-1 w-full border border-slate-300 rounded px-3 py-1.5 text-sm"
                />
              </div>

              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded text-[11px] text-amber-800 flex items-start">
                <ShieldAlert className="w-4 h-4 mr-1.5 shrink-0 text-amber-600 mt-0.5" />
                <span>
                  ACID Transaction: Batches will be locked and deducted atomically based on earliest expiration date.
                </span>
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowIssueModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-700 text-white rounded-lg text-xs font-medium hover:bg-red-800"
                >
                  Confirm Issue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
