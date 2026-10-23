import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';
import { BloodInventoryItem } from '../types';
import { Clock } from 'lucide-react';

export const Inventory: React.FC = () => {
  const [inventory, setInventory] = useState<BloodInventoryItem[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [bloodGroup, setBloodGroup] = useState('');
  const [status, setStatus] = useState('Available');

  useEffect(() => {
    fetchInventory();
    fetchSummary();
  }, [bloodGroup, status]);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (bloodGroup) params.blood_group = bloodGroup;
      if (status) params.status = status;
      const res = await apiClient.get('/inventory', { params });
      setInventory(res.data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const res = await apiClient.get('/inventory/summary');
      setSummary(res.data);
    } catch (err: any) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Blood Inventory & Cold Storage</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Traceable blood units with FIFO earliest-expiry allocation and real-time low-stock tracking
          </p>
        </div>
      </div>

      {/* Stock Cards by Blood Group */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {summary.groups.map((g: any) => (
            <div 
              key={g.blood_group}
              className={`p-3 rounded-xl border text-center ${
                g.is_low_stock 
                  ? 'bg-amber-50/60 border-amber-200 text-amber-900' 
                  : 'bg-white border-slate-200 text-slate-900'
              }`}
            >
              <span className="text-sm font-black text-red-700 block">{g.blood_group}</span>
              <span className="text-xl font-bold block mt-1">{g.units_available}</span>
              <span className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider">
                {g.is_low_stock ? 'Low Stock' : 'Units'}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap gap-3">
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
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-600"
        >
          <option value="">All Statuses</option>
          <option value="Available">Available (Unissued)</option>
          <option value="Issued">Issued</option>
          <option value="Expired">Expired</option>
        </select>

        {summary && summary.expiring_soon_count > 0 && (
          <div className="ml-auto flex items-center text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg">
            <Clock className="w-3.5 h-3.5 mr-1.5" />
            {summary.expiring_soon_count} Units Expiring Within 7 Days
          </div>
        )}
      </div>

      {/* Inventory Batches Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
              <tr>
                <th className="px-5 py-3.5">Batch Number</th>
                <th className="px-5 py-3.5">Blood Group</th>
                <th className="px-5 py-3.5">Component</th>
                <th className="px-5 py-3.5">Volume</th>
                <th className="px-5 py-3.5">Collection Date</th>
                <th className="px-5 py-3.5">Expiry Date</th>
                <th className="px-5 py-3.5">Location</th>
                <th className="px-5 py-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-slate-500">
                    Loading inventory records...
                  </td>
                </tr>
              ) : inventory.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-slate-500">
                    No inventory units found in database.
                  </td>
                </tr>
              ) : (
                inventory.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition">
                    <td className="px-5 py-3 font-mono font-medium text-slate-900">{item.batch_number}</td>
                    <td className="px-5 py-3">
                      <span className="inline-block px-2 py-0.5 font-bold rounded bg-red-100 text-red-800 text-xs">
                        {item.blood_group}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-600">{item.component_type}</td>
                    <td className="px-5 py-3 text-slate-600">{item.volume_ml} mL</td>
                    <td className="px-5 py-3 text-slate-600">{item.collection_date}</td>
                    <td className="px-5 py-3 font-semibold text-slate-800">{item.expiry_date}</td>
                    <td className="px-5 py-3 text-slate-500">{item.storage_location}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                        item.status === 'Available' ? 'bg-emerald-100 text-emerald-800' :
                        item.status === 'Issued' ? 'bg-blue-100 text-blue-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
